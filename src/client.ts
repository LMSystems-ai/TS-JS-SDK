// client.ts
import { Client as LangGraphClient } from "@langchain/langgraph-sdk";
import { AuthenticationError, APIError, GraphError } from "./exceptions";
import { Config } from "@langchain/langgraph-sdk";
import { LangGraphConfig } from "./config";

interface GraphInfo {
  graph_url: string;
  lgraph_api_key: string;
  assistant_id?: string;
  configurables?: Record<string, any>;
}

interface ClientConfig {
  graphName: string;
  apiKey: string;
}

interface PurchasedGraphConfig extends Partial<Config> {
  configurable?: Record<string, any>;
  tags?: string[];
  recursion_limit?: number;
}

type StreamMode = "values" | "messages" | "updates";

export class LmsystemsClient {
  private graphName: string;
  private apiKey: string;
  private client?: LangGraphClient;
  private graphInfo?: GraphInfo;
  private defaultAssistantId?: string;

  constructor({ graphName, apiKey }: ClientConfig) {
    this.graphName = graphName;
    this.apiKey = apiKey;
  }

  public async setup(): Promise<void> {
    try {
      // Get graph info and store it
      this.graphInfo = await this.getGraphInfo();

      // Store default assistant ID
      this.defaultAssistantId = this.graphInfo.assistant_id;

      // Initialize LangGraph client
      this.client = new LangGraphClient({
        apiUrl: this.graphInfo.graph_url,
        apiKey: this.graphInfo.lgraph_api_key
      });
    } catch (error) {
      throw new APIError(`Failed to initialize client: ${String(error)}`);
    }
  }

  private async getGraphInfo(): Promise<GraphInfo> {
    try {
      const response = await fetch(`${LangGraphConfig.getBaseUrl()}/api/get_graph_info`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ graph_name: this.graphName })
      });

      if (response.status === 401) {
        throw new AuthenticationError("Invalid API key");
      } else if (response.status === 403) {
        throw new GraphError(`Graph '${this.graphName}' has not been purchased`);
      } else if (response.status === 404) {
        throw new GraphError(`Graph '${this.graphName}' not found`);
      } else if (!response.ok) {
        throw new APIError(`Backend API error: ${await response.text()}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof AuthenticationError || error instanceof GraphError) {
        throw error;
      }
      throw new APIError(`Failed to communicate with server: ${String(error)}`);
    }
  }

  public async *stream(
    input: Record<string, any>,
    userConfig: PurchasedGraphConfig = {},
    streamModes: StreamMode[] = ["values", "messages", "updates"]
  ): AsyncGenerator<unknown> {
    if (!this.client) {
      await this.setup();
    }

    try {
      // Create thread
      const thread = await this.client!.threads.create();

      // Use stream directly with assistant ID (not run ID)
      const streamIterator = this.client!.runs.stream(
        thread.thread_id,
        this.defaultAssistantId!,
        {
          input,
          config: this.mergeConfigs(this.graphInfo?.configurables, userConfig),
          streamMode: streamModes
        }
      );

      // Yield chunks from the stream
      for await (const chunk of streamIterator) {
        yield chunk;
      }
    } catch (error) {
      throw new APIError(`Stream error: ${String(error)}`);
    }
  }

  private mergeConfigs(
    storedConfig: Partial<GraphInfo> = {},
    userConfig: PurchasedGraphConfig = {}
  ): Config {
    // Ensure we return a valid Config object
    return {
      configurable: {
        ...(storedConfig.configurables || {}),
        ...(userConfig.configurable || {})
      },
      tags: userConfig.tags || [],
      recursion_limit: userConfig.recursion_limit || 100
    };
  }
}
