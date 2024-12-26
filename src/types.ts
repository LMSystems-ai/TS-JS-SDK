import { Config } from "@langchain/langgraph-sdk";
import { ChatMessage } from '@langchain/core/messages';
import { BaseMessage } from '@langchain/core/messages';

export interface PurchasedGraphConfig extends Partial<Config> {
  assistant_id?: string;
  streamMode?: "values" | "updates" | "debug" | "messages" | "custom";
}

export interface GraphInfo {
  graph_name: string;
  graph_url: string;
  lgraph_api_key: string;
  configurables?: Record<string, unknown>;
  assistant_id?: string;
}

export interface GraphInput {
  messages: ChatMessage[];
  [key: string]: any;
}

export interface CheckpointListOptions {
  // Add the properties you need for checkpoint listing
  // For example:
  limit?: number;
  offset?: number;
  // Add other options as needed
}

export type PregelInputType = any;
export type PregelOutputType = any;
export type PregelOptions = {
  configurable?: Record<string, any>;
  subgraphs?: boolean;
  [key: string]: any;
};

export interface StreamChunk {
  nodeIds?: string[];
  state?: Record<string, any>;
  messages?: BaseMessage[];
}

export interface Thread {
  thread_id?: string;
  id?: string;
  [key: string]: unknown;
}