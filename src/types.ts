import { RunnableConfig } from '@langchain/core/runnables';
import { ChatMessage } from '@langchain/core/messages';

export interface PurchasedGraphConfig extends RunnableConfig {
  configurable?: Record<string, any>;
  [key: string]: any;
}

export interface GraphInfo {
  graph_name: string;
  graph_url: string;
  lgraph_api_key: string;
  configurables?: Record<string, any>;
}

export interface GraphInput {
  messages: ChatMessage[];
  [key: string]: any;
}

export interface CheckpointListOptions {
  limit?: number;
  offset?: number;
}

export type PregelInputType = any;
export type PregelOutputType = any;
export type PregelOptions = {
  configurable?: Record<string, any>;
  subgraphs?: boolean;
  [key: string]: any;
};
