export class ProviderError extends Error {
  public readonly details?: unknown;
  constructor(message: string, details?: unknown) {
    super(message);
    this.name = "ProviderError";
    this.details = details;
  }
}
