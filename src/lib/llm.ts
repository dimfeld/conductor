import { env } from '$env/dynamic/private';
import { createDeepSeek } from '@ai-sdk/deepseek';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

const cerebras = createOpenAICompatible({
  name: 'cerebras',
  apiKey: env.CEREBRAS_API_KEY,
  baseURL: 'https://api.cerebras.ai/v1'
});

const deepseek = createDeepSeek({
  apiKey: env.DEEPSEEK_API_KEY
})('deepseek-chat');

const llama8b = cerebras('llama-3.1-8b');
const llama70b = cerebras('llama-3.3-70b');

export { deepseek, llama8b, llama70b };
