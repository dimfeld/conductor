/** Split a list of requests into batches and run them with rate limiting.
 *
 * TODO some kind of token bucket that can run requests more eagerly
 */
export async function batchRequests<T>(
  numRequests: number,
  rateLimit: { requests: number; interval: number },
  fn: (i: number) => Promise<T>
): Promise<PromiseSettledResult<T>[]> {
  const results: PromiseSettledResult<T>[] = [];

  let lastBatchTime = 0;
  for (let base = 0; base < numRequests; base += rateLimit.requests) {
    // Wait if needed to respect the rate limit
    const now = Date.now();
    const timeSinceLastBatch = (now - lastBatchTime) / 1000;
    if (timeSinceLastBatch < rateLimit.interval) {
      const waitTime = (rateLimit.interval - timeSinceLastBatch) * 1000;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    // Run the current batch
    const chunkSize = Math.min(rateLimit.requests, numRequests - base);
    const chunkResults = await Promise.allSettled(
      Array.from({ length: chunkSize }, (_, i) => fn(base + i))
    );
    results.push(...chunkResults);
    lastBatchTime = Date.now();
  }

  return results;
}
