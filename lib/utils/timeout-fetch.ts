const DEFAULT_FETCH_TIMEOUT_MS = 8000;

export function createTimeoutFetch(timeoutMs = DEFAULT_FETCH_TIMEOUT_MS): typeof fetch {
  return async (input, init) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const originalSignal = init?.signal;

    if (originalSignal?.aborted) {
      clearTimeout(timeout);
      throw new DOMException("The operation was aborted.", "AbortError");
    }

    const abortOriginal = () => controller.abort();
    originalSignal?.addEventListener("abort", abortOriginal, { once: true });

    try {
      return await fetch(input, {
        ...init,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
      originalSignal?.removeEventListener("abort", abortOriginal);
    }
  };
}
