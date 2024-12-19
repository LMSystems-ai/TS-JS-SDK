import { PurchasedGraph } from '../src/purchased-graph';
import { StateGraph, MessagesAnnotation, START } from "@langchain/langgraph";
import dotenv from 'dotenv';

dotenv.config();

(async () => {
  try {
    const stateValues = {
      repo_url: "https://github.com/RVCA212/airport-gaming",
      github_token: process.env.GITHUB_TOKEN,
      repo_path: "/users/152343"
    };

    const graphName = "stripe-expert-31";
    const apiKey = "lmsys-424cf0b9d1b0a290adc42f547f582e0b03df204591da9633";

    console.log("Creating new PurchasedGraph instance...");
    const purchasedGraph = new PurchasedGraph(
      graphName,
      apiKey,
      undefined,
      stateValues
    );

    // Make sure to wait for initialization before creating the parent graph
    await purchasedGraph.waitForInitialization();

    console.log("PurchasedGraph created and initialized");

    const parentGraph = new StateGraph(MessagesAnnotation);
    parentGraph.addNode("purchased_node", purchasedGraph);
    parentGraph.addEdge(START, "purchased_node");
    const graph = parentGraph.compile();

    // Add error handling for the invocations
    try {
      const result = await graph.invoke({
        messages: [{ role: "user", content: "what's this repo about?" }],
      });
      console.log("Final result:", result);
    } catch (error) {
      console.error("Error during invoke:", error);
    }

    // Or stream outputs from both parent and subgraph
    console.log("Streaming output...");
    for await (const chunk of await graph.stream({
      messages: [{ role: "user", content: "what's this repo about?" }],
    })) {
      console.log("Got chunk:", chunk);
    }

    for await (const chunk of await graph.stream({
      messages: [{ role: "user", content: "what's this repo about?" }],
    }, {
      subgraphs: true,
      configurable: {
        messagesKey: "messages"
      }
    })) {
      console.log("Got chunk:", chunk);
    }
  } catch (error) {
    console.error("Error in main execution:", error);
  }
})();