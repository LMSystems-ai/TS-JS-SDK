import { RemoteGraph } from "@langchain/langgraph/remote";
import { BaseMessage, AIMessage, FunctionMessage } from "@langchain/core/messages";
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
      console.log('Initializing graph with base URL:', baseUrl);
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
      console.log('Received graph info:', {
        url: this.graphInfo.graph_url,
        name: this.graphInfo.graph_name
      });

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

      console.log('Initialized RemoteGraph with URL:', this.graphInfo.graph_url);
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
    return new AIMessage({
      content: typeof content === "string" ? content : JSON.stringify(content)
    });
  }

  private formatAsFunctionMessage(name: string, content: any): BaseMessage {
    return new FunctionMessage({
      content: typeof content === "string" ? content : JSON.stringify(content),
      name
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
    const messages = Array.isArray(response)
      ? response.map(chunk => this.formatAsAIMessage(chunk))
      : [this.formatAsAIMessage(response)];

    // Return an object with messages under the appropriate key
    return { messages };
  }

  public override async stream(
    input: Record<string, any>,
    options?: RunnableConfig
  ): Promise<IterableReadableStream<BaseMessage>> {
    // Ensure initialization is complete before any operation
    await this.waitForInitialization();

    if (!this.graphInfo?.graph_url) {
      throw new Error('Graph URL not properly initialized');
    }

    // Merge defaultStateValues with input
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
            if (typeof chunk === "string") {
              controller.enqueue(self.formatAsAIMessage(chunk));
            } else if (chunk && typeof chunk === "object") {
              if ("function_call" in chunk) {
                controller.enqueue(
                  self.formatAsFunctionMessage(
                    chunk.function_call.name,
                    chunk.function_call.arguments
                  )
                );
              } else {
                controller.enqueue(self.formatAsAIMessage(chunk));
              }
            }
          }
          controller.close();
        } catch (e) {
          controller.error(e);
        }
      },

      async cancel() {
        // Handle any cleanup if needed
      }
    });
  }
}
