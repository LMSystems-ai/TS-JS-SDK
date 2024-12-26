// usage-example.ts
import { LmsystemsClient } from '../src/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function main() {
    // Initialize client with your graph name and API key
    const client = new LmsystemsClient({
        graphName: 'stripe-expert-31',
        apiKey: 'your-lmsystems-api-key'
    });

    await client.setup();

    // Prepare your input (required for this specific graph)
    const input = {
        messages: [{ role: 'user', content: "What's this repo about?" }],
        repo_url: 'https://github.com/RVCA212/airport-gaming',
        github_token: process.env.GITHUB_TOKEN,
        repo_path: '/users/152343',
    };

    const config = {
        configurable: {
            anthropic_api_key: process.env.ANTHROPIC_API_KEY,
        }
    };

    try {
        // Option 1: Stream everything (default)
        const stream = client.stream(input, config);
        for await (const chunk of stream) {
            console.log(chunk);
        }

        // Option 2: Stream only values
        // const valuesStream = client.stream(input, config, ["values"]);
        // for await (const chunk of valuesStream) {
        //     console.log('Value:', chunk);
        // }

        // Option 3: Stream only messages
        // const messageStream = client.stream(input, config, ["messages"]);
        // for await (const chunk of messageStream) {
        //     console.log('Message:', chunk);
        // }

        // Option 4: Stream only state updates
        // const updateStream = client.stream(input, config, ["updates"]);
        // for await (const chunk of updateStream) {
        //     console.log('State Update:', chunk);
        // }

        // Option 5: Combine multiple stream types
        // const combinedStream = client.stream(input, config, ["values", "messages"]);
        // for await (const chunk of combinedStream) {
        //     console.log('Combined:', chunk);
        // }

    } catch (error) {
        console.error('Error:', error);
    }
}

main();