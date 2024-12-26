# LMSystems SDK

[![npm version](https://badge.fury.io/js/lmsystems.svg)](https://badge.fury.io/js/lmsystems)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

The official Node.js SDK for integrating purchased graphs from the [LMSystems Marketplace](https://www.lmsystems.ai/marketplace).

## Overview

This SDK provides two main ways to integrate LMSystems marketplace graphs:

1. **LmsystemsClient**: A standalone client for direct chat/streaming interactions with purchased graphs
2. **PurchasedGraph**: A class for using purchased graphs as subgraphs within your own LangGraph applications

## Installation

```bash
npm install lmsystems
```

## Prerequisites

- Node.js >= 18
- An LMSystems account with purchased graphs
- Your LMSystems API key (found at [lmsystems.ai/account](https://www.lmsystems.ai/account))

## Quick Start

### Standalone Chat Application (LmsystemsClient)

Use this approach when you want to directly interact with a purchased graph as a chat application:

```typescript
import { LmsystemsClient } from 'lmsystems';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function main() {
    // Initialize the client
    const client = new LmsystemsClient({
        graphName: 'your-graph-name',
        apiKey: process.env.LMSYSTEMS_API_KEY
    });

    // Setup the client (required before first use)
    await client.setup();

    try {
        // Prepare your input
        const input = {
            messages: [{ role: 'user', content: "What can you help me with?" }],
            // Add any other input parameters your graph requires
        };

        // Optional configuration
        const config = {
            configurable: {
                // Add any API keys or configuration your graph needs
                anthropic_api_key: process.env.ANTHROPIC_API_KEY,
            }
        };

        // Stream the response
        console.log('Starting stream...');
        const stream = client.stream(input, config);

        // Process the stream chunks
        for await (const chunk of stream) {
            if (typeof chunk === 'object') {
                console.log(JSON.stringify(chunk, null, 2));
            } else {
                console.log(chunk);
            }
        }
    } catch (error) {
        console.error('Error:', error);
    }
}
```

### Using as a Subgraph (PurchasedGraph)

Use this approach when you want to incorporate a purchased graph into your own LangGraph application:

```typescript
import { PurchasedGraph } from 'lmsystems';
import { StateGraph, MessagesAnnotation, START } from "@langchain/langgraph";

async function main() {
    // Initialize the purchased graph
    const purchasedGraph = new PurchasedGraph(
        "your-graph-name",
        process.env.LMSYSTEMS_API_KEY
    );

    await purchasedGraph.waitForInitialization();

    // Create your parent graph
    const parentGraph = new StateGraph(MessagesAnnotation);
    parentGraph.addNode("purchased_node", purchasedGraph);
    parentGraph.addEdge(START, "purchased_node");
    const graph = parentGraph.compile();

    // Use within your larger application
    const result = await graph.invoke({
        messages: [{ role: "user", content: "Your message here" }],
    });
}
```

## API Reference

### LmsystemsClient

The client class for direct chat interactions with purchased graphs.

#### Constructor

```typescript
constructor({
    graphName: string,    // Name of your purchased graph
    apiKey: string        // Your LMSystems API key
})
```

#### Methods

- `setup(): Promise<void>`
  - Initializes the client and fetches necessary graph information
  - Must be called before using stream()

- `stream(
    input: Record<string, any>,
    config?: PurchasedGraphConfig,
    streamModes?: StreamMode[]
  ): AsyncGenerator<unknown>`
  - Streams responses from the graph
  - `input`: Your graph's input data
  - `config`: Optional configuration (API keys, etc.)
  - `streamModes`: Optional array of stream modes ("values" | "messages" | "updates")

### PurchasedGraph

The main class for interacting with LMSystems marketplace graphs.

#### Constructor

```typescript
constructor(
    graphName: string,        // Name of your purchased graph
    apiKey: string,          // Your LMSystems API key
    config?: RunnableConfig, // Optional configuration
    defaultStateValues?: Record<string, any>  // Default values for graph state
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

The SDK requires the following environment variable:

- `LMSYSTEMS_API_KEY`: Your LMSystems API key (found at [lmsystems.ai/account](https://www.lmsystems.ai/account))

## Error Handling

The SDK provides several error types:

- `AuthenticationError`: Issues with API key or authentication
- `GraphError`: Problems with graph execution or access
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