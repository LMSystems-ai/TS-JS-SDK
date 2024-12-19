export class LmsystemsError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'LmsystemsError';
    }
}

export class AuthenticationError extends LmsystemsError {
    constructor(message: string) {
      super(`${message} To get your API key, visit: https://www.lmsystems.ai/account`);
      this.name = 'AuthenticationError';
    }
}

export class GraphError extends LmsystemsError {
  constructor(message: string) {
    super(message);
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
  constructor(message: string) {
    super(message);
    this.name = 'APIError';
  }
}

export class MessageCoercionError extends LmsystemsError {
  constructor(message: string, details?: unknown) {
    super(`Message coercion failed: ${message}${details ? `\nDetails: ${JSON.stringify(details, null, 2)}` : ''}`);
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