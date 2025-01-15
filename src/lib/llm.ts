import { env } from '$env/dynamic/private';
import { createDeepSeek } from '@ai-sdk/deepseek';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { createAnthropic } from '@ai-sdk/anthropic';
import type { LanguageModel } from 'ai';

const openrouter = createOpenRouter({
  apiKey: env.OPENROUTER_API_KEY,
});

const cerebras = createOpenAICompatible({
  name: 'cerebras',
  apiKey: env.CEREBRAS_API_KEY,
  baseURL: 'https://api.cerebras.ai/v1',
});

const anthropic = createAnthropic({
  apiKey: env.ANTHROPIC_API_KEY,
});

const deepseek = createDeepSeek({
  apiKey: env.DEEPSEEK_API_KEY,
})('deepseek-chat');

const cerebrasLlama318b = cerebras('llama-3.1-8b');
const cerebrasLlama3370b = cerebras('llama-3.3-70b');

const openrouterLlama318b = openrouter('meta-llama/llama-3.1-8b-instruct');
const openrouterLlama3370b = openrouter('meta-llama/llama-3.3-70b-instruct');
const openrouterClaude35Sonnet = openrouter('anthropic/claude-3.5-sonnet');

const anthropicClaude35Sonnet = anthropic('claude-3.5-sonnet-20241022', {
  cacheControl: true,
});

let openRouterRateLimit: { requests: number; interval: number } | null = null;

/** Return the rate limit for OpenRouter in requests per minute */
export async function getOpenRouterRateLimit() {
  if (openRouterRateLimit) {
    return openRouterRateLimit;
  }

  const response = await fetch('https://openrouter.ai/api/v1/auth/key', {
    headers: {
      Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
    },
  });
  const data = await response.json();
  console.log({ data });
  const rateLimit = data.data.rate_limit as { interval: string; requests: number };

  if (rateLimit.interval.endsWith('s')) {
    const seconds = parseInt(rateLimit.interval.replace('s', ''));
    openRouterRateLimit = {
      requests: rateLimit.requests,
      interval: seconds,
    };
  }

  if (rateLimit.interval.endsWith('m')) {
    const minutes = parseInt(rateLimit.interval.replace('m', ''));
    openRouterRateLimit = {
      requests: rateLimit.requests,
      interval: minutes * 60,
    };
  }

  return openRouterRateLimit;
}

/** Return the rate limit for a given model, in requests per minute */
export async function getRateLimit(model: LanguageModel) {
  console.log('Getting rate limit for', model.provider);
  if (model.provider.startsWith('openrouter.')) {
    return getOpenRouterRateLimit();
  } else if (model.provider.startsWith('cerebras.')) {
    return { requests: 30, interval: 60 };
  } else if (model.provider.startsWith('deepseek.')) {
    // DeepSeek has no published rate limit and it's said to be very high.
    return { requests: 500, interval: 1 };
  }

  return null;
}

export function extractTag(text: string, tag: string) {
  const regex = new RegExp(`<${tag}>(.*)</${tag}>`, 'ms');
  const match = text.match(regex);
  return match ? match[1].trim() : null;
}

export function extractTags(text: string, tags: string[]) {
  return Object.fromEntries(tags.map((tag) => [tag, extractTag(text, tag)]));
}

export {
  deepseek,
  openrouter,
  cerebrasLlama318b,
  cerebrasLlama3370b,
  openrouterClaude35Sonnet,
  openrouterLlama318b,
  openrouterLlama3370b,
  anthropicClaude35Sonnet,
};
