export class LmsystemsError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'LmsystemsError';
    }
}

export class AuthenticationError extends LmsystemsError {
    constructor(message: string) {
      super(
        `Authentication failed: ${message}\n` +
        'To get your API key:\n' +
        '1. Visit https://www.lmsystems.ai/account\n' +
        '2. Navigate to the API Keys section\n' +
        '3. Create a new key or copy your existing key'
      );
      this.name = 'AuthenticationError';
    }
}

export class GraphError extends LmsystemsError {
  constructor(message: string, graphName?: string) {
    let errorMessage = `Graph error: ${message}`;

    if (graphName) {
      errorMessage += '\n\nPossible solutions:\n' +
        `1. Verify "${graphName}" is the correct graph name\n` +
        '2. Check if you have purchased this graph at https://www.lmsystems.ai/marketplace\n' +
        '3. Ensure your account has active access to this graph';
    }

    super(errorMessage);
    this.name = 'GraphError';
  }
}

export class InputError extends LmsystemsError {
  constructor(message: string) {
      super(message);
      this.name = 'InputError';
    }
}

export class APIError extends LmsystemsError {
  constructor(message: string, statusCode?: number) {
    let errorMessage = `API error: ${message}`;

    if (statusCode) {
      switch (statusCode) {
        case 429:
          errorMessage += '\n\nRate limit exceeded. Please wait before making more requests.';
          break;
        case 500:
          errorMessage += '\n\nServer error. If this persists, please contact sean@lmsystems.ai';
          break;
        case 503:
          errorMessage += '\n\nService temporarily unavailable. Please try again later.';
          break;
      }
    }

    super(errorMessage);
    this.name = 'APIError';
  }
}

export class ConfigurationError extends LmsystemsError {
  constructor(message: string, config?: Record<string, any>) {
    let errorMessage = `Configuration error: ${message}`;

    if (config) {
      errorMessage += '\n\nProvided configuration:\n' +
        JSON.stringify(config, null, 2) +
        '\n\nMake sure to include any required API keys or settings your graph needs in the config.configurable object.';
    }

    super(errorMessage);
    this.name = 'ConfigurationError';
  }
}

export class StreamError extends LmsystemsError {
  constructor(message: string, threadId?: string) {
    let errorMessage = `Streaming error: ${message}`;

    if (threadId) {
      errorMessage += `\n\nThread ID: ${threadId}\n` +
        'This error occurred while streaming responses. Possible solutions:\n' +
        '1. Check your network connection\n' +
        '2. Verify all required configuration values are provided\n' +
        '3. Ensure your graph is still active and accessible';
    }

    super(errorMessage);
    this.name = 'StreamError';
  }
}

export class MessageCoercionError extends LmsystemsError {
  constructor(message: string, details?: unknown) {
    super(
      `Message format error: ${message}` +
      (details ? `\n\nDetails:\n${JSON.stringify(details, null, 2)}` : '') +
      '\n\nEnsure your messages follow the format: { role: "user" | "assistant", content: string }'
    );
    this.name = 'MessageCoercionError';
  }
}

export class GraphMessageError extends LmsystemsError {
  constructor(message: string) {
    super(`Graph message error: ${message}`);
    this.name = 'GraphMessageError';
  }
}

export class MessageValidationError extends LmsystemsError {
  constructor(message: string, details?: unknown) {
    super(`Message validation failed: ${message}${details ? `\nDetails: ${JSON.stringify(details, null, 2)}` : ''}`);
    this.name = 'MessageValidationError';
  }
}