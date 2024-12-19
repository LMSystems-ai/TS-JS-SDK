# LMSystems SDK

[![npm version](https://badge.fury.io/js/lmsystems.svg)](https://badge.fury.io/js/lmsystems)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

The official Node.js SDK for integrating purchased graphs from the [LMSystems Marketplace](https://www.lmsystems.ai/marketplace).

## Overview

This SDK allows you to easily integrate and run LMSystems marketplace graphs in your Node.js applications. It provides a wrapper around LangChain's RemoteGraph functionality, specifically designed for executing purchased LMSystems graphs.

## Installation

```bash
npm install lmsystems
```


## Prerequisites

- Node.js >= 18
- An LMSystems account with purchased graphs
- Your LMSystems API key (found at [lmsystems.ai/account](https://www.lmsystems.ai/account))

## Quick Start

```typescript
import { PurchasedGraph } from 'lmsystems';
import { StateGraph, MessagesAnnotation, START } from "@langchain/langgraph";
import dotenv from 'dotenv';

// Load environment variables (optional)
dotenv.config();

async function main() {
    // Initialize your graph with required parameters
    const purchasedGraph = new PurchasedGraph(
        "your-graph-name", // The name of your purchased graph
        "your-lmsystems-api-key", // Your LMSystems API key
        undefined, // Optional config
        { // Optional state values
            // Add any state values your graph requires
        }
    );

    // Wait for initialization
    await purchasedGraph.waitForInitialization();

    // Create a parent graph (recommended approach)
    const parentGraph = new StateGraph(MessagesAnnotation);
    parentGraph.addNode("purchased_node", purchasedGraph);
    parentGraph.addEdge(START, "purchased_node");
    const graph = parentGraph.compile();

    // Use the graph
    try {
        // Single invocation
        const result = await graph.invoke({
            messages: [{ role: "user", content: "Your message here" }],
        });
        console.log("Result:", result);

        // Or stream the output
        for await (const chunk of await graph.stream({
            messages: [{ role: "user", content: "Your message here" }],
        })) {
            console.log("Chunk:", chunk);
        }
    } catch (error) {
        console.error("Error:", error);
    }
}
```


## API Reference

### `PurchasedGraph`

The main class for interacting with LMSystems marketplace graphs.

#### Constructor

```typescript
constructor(
    graphName: string,        // Name of your purchased graph
    apiKey: string,          // Your LMSystems API key
    config?: RunnableConfig, // Optional configuration
    defaultStateValues?: Record<string, any>,  // Default values for graph state
    baseUrl?: string,        // Optional custom base URL
    developmentMode?: boolean // Optional development mode flag
)
```


#### Methods

- `waitForInitialization(): Promise<void>`
  - Ensures the graph is fully initialized before use
  - Must be called before any operations

- `invoke(input: Record<string, any>, options?: RunnableConfig): Promise<Record<string, BaseMessage[]>>`
  - Executes the graph synchronously
  - Returns the complete result

- `stream(input: Record<string, any>, options?: RunnableConfig): Promise<IterableReadableStream<BaseMessage>>`
  - Executes the graph and streams the results
  - Useful for real-time output

## Environment Variables

The SDK supports the following environment variables:

- `LMSYSTEMS_BASE_URL`: Custom base URL for the LMSystems API (defaults to 'https://api.lmsystems.ai')

## Error Handling

The SDK provides several error types:

- `AuthenticationError`: Issues with API key or authentication
- `GraphError`: Problems with graph execution
- `InputError`: Invalid input parameters
- `APIError`: General API communication issues

## Best Practices

1. Always wait for initialization:

```typescript
await purchasedGraph.waitForInitialization();
```


2. Use try-catch blocks for error handling:

```typescript
try {
    const result = await graph.invoke(input);
} catch (error) {
    if (error instanceof AuthenticationError) {
        // Handle authentication issues
    }
    // Handle other errors
}
```


3. Use streaming for real-time responses:

```typescript
for await (const chunk of await graph.stream(input)) {
// Process chunks as they arrive
}
```


## Support

- Documentation: [LMSystems Documentation](https://www.lmsystems.ai/docs)
- Marketplace: [LMSystems Marketplace](https://www.lmsystems.ai/marketplace)
- Account Management: [LMSystems Account](https://www.lmsystems.ai/account)

## License

This project is licensed under the MIT License - see the LICENSE file for details.