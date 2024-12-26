import { RemoteGraph } from "@langchain/langgraph/remote";
import { BaseMessage, AIMessage, FunctionMessage, HumanMessage } from "@langchain/core/messages";
import { RunnableConfig } from "@langchain/core/runnables";
import { IterableReadableStream } from "@langchain/core/utils/stream";
import os from "os";
import dotenv from 'dotenv';
import axios from 'axios';

// Initialize dotenv at the top of the file
dotenv.config();

interface GraphInfo {
  graph_name: string;
  graph_url: string;
  lgraph_api_key: string;
  configurables?: Record<string, any>;
}

interface MessageResponse {
  type?: string;
  name?: string;
  content: string;
  additional_kwargs?: Record<string, any>;
}

interface StreamResponse {
  messages?: MessageResponse[];
  function_call?: {
    name: string;
    arguments: string;
  };
}

interface StateUpdate {
  nodeIds: string[];
  state: Record<string, any>;
}

export class PurchasedGraph extends RemoteGraph {
  private initialized: boolean = false;
  private initializationPromise: Promise<void>;
  private graphInfo!: GraphInfo;
  private defaultStateValues: Record<string, any>;

  constructor(
    graphName: string,
    apiKey: string,
    config?: RunnableConfig,
    defaultStateValues: Record<string, any> = {},
    baseUrl: string = process.env.LMSYSTEMS_BASE_URL ?? 'https://api.lmsystems.ai',
    developmentMode = false
  ) {
    // Initialize with temporary values
    super({
      graphId: graphName,  // Use graphName as temporary ID
      url: baseUrl,        // Use baseUrl as temporary URL
      apiKey: apiKey       // Use provided apiKey temporarily
    });

    this.initializationPromise = this.initialize(graphName, apiKey, baseUrl, config);
    this.defaultStateValues = defaultStateValues;
  }

  public async waitForInitialization(): Promise<void> {
    return this.initializationPromise;
  }

  private async initialize(graphName: string, apiKey: string, baseUrl: string, config?: RunnableConfig): Promise<void> {
    if (this.initialized) return;

    try {
      const response = await axios.post(
        `${baseUrl}/api/get_graph_info`,
        { graph_name: graphName },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      this.graphInfo = response.data;

      const newConfig = {
        graphId: this.graphInfo.graph_name,
        url: this.graphInfo.graph_url,
        apiKey: this.graphInfo.lgraph_api_key
      };

      Object.assign(this, new RemoteGraph(newConfig));

      const mergedConfig = {
        ...this.graphInfo.configurables,
        ...config
      };

      this.initialized = true;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        switch (error.response?.status) {
          case 401:
            throw new Error('Invalid API key');
          case 403:
            throw new Error(`Graph '${graphName}' has not been purchased`);
          case 404:
            throw new Error(`Graph '${graphName}' not found`);
          default:
            throw new Error(`Backend API error: ${error.message}`);
        }
      }
      throw error;
    }
  }

  private formatAsAIMessage(content: any): BaseMessage {
    if (typeof content === "string") {
      return new AIMessage({ content });
    }

    // Handle message objects with type information
    if (content.type === "human") {
      return new HumanMessage({
        content: content.content,
        additional_kwargs: content.additional_kwargs || {}
      });
    } else if (content.type === "ai") {
      return new AIMessage({
        content: content.content,
        additional_kwargs: content.additional_kwargs || {}
      });
    } else if (content.type === "function") {
      return new FunctionMessage({
        content: content.content,
        name: content.name,
        additional_kwargs: content.additional_kwargs || {}
      });
    }

    // Default to AIMessage for unknown types
    return new AIMessage({
      content: JSON.stringify(content)
    });
  }

  private formatAsFunctionMessage(name: string, content: any): BaseMessage {
    return new FunctionMessage({
      content: typeof content === "string" ? content : JSON.stringify(content),
      name,
      additional_kwargs: {}
    });
  }

  public override async invoke(
    input: Record<string, any>,
    options?: RunnableConfig
  ): Promise<Record<string, BaseMessage[]>> {
    await this.waitForInitialization();
    if (!this.graphInfo?.graph_url) {
      throw new Error('Graph URL not properly initialized');
    }

    const mergedInput = {
      ...this.defaultStateValues,
      ...input
    };

    const response = await super.invoke(mergedInput, options);

    const messages = Array.isArray(response.messages)
      ? response.messages.map((msg: MessageResponse) => {
          if (msg.type === 'function') {
            return this.formatAsFunctionMessage(msg.name || '', msg.content);
          }
          return this.formatAsAIMessage(msg);
        })
      : [this.formatAsAIMessage(response)];

    return { messages };
  }

  public override async stream(
    input: Record<string, any>,
    options?: RunnableConfig
  ): Promise<IterableReadableStream<BaseMessage | StateUpdate>> {
    await this.waitForInitialization();

    if (!this.graphInfo?.graph_url) {
      throw new Error('Graph URL not properly initialized');
    }

    const mergedInput = {
      ...this.defaultStateValues,
      ...input
    };

    const parentStream = await super.stream(mergedInput, options);
    const self = this;

    return new IterableReadableStream({
      async start(controller) {
        try {
          for await (const chunk of parentStream) {
            if (Array.isArray(chunk) && chunk.length === 2) {
              const [nodeIds, state] = chunk;
              controller.enqueue({
                nodeIds,
                state
              } as StateUpdate);
            } else if (typeof chunk === "object") {
              if ("function_call" in chunk) {
                controller.enqueue(
                  self.formatAsFunctionMessage(
                    (chunk as StreamResponse).function_call?.name || '',
                    (chunk as StreamResponse).function_call?.arguments || ''
                  )
                );
              } else if ("messages" in chunk) {
                for (const msg of (chunk as StreamResponse).messages || []) {
                  controller.enqueue(self.formatAsAIMessage(msg));
                }
              } else {
                controller.enqueue(self.formatAsAIMessage(chunk));
              }
            }
          }
          controller.close();
        } catch (e) {
          controller.error(e);
        }
      }
    });
  }
}
