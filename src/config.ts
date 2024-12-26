export class LangGraphConfig {
    static readonly DEFAULT_BASE_URL = process.env.LMSYSTEMS_BASE_URL || 'https://api.lmsystems.ai';

    static getBaseUrl(): string {
      return process.env.LMSYSTEMS_BASE_URL || LangGraphConfig.DEFAULT_BASE_URL;
    }
}