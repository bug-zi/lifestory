import type { AIConfig, AIProvider } from '@/types';

interface ProviderEndpoint {
  url: string;
  headerFn: (apiKey: string) => Record<string, string>;
}

const PROVIDER_ENDPOINTS: Record<AIProvider, ProviderEndpoint> = {
  deepseek: {
    url: 'https://api.deepseek.com/v1/chat/completions',
    headerFn: (k) => ({ Authorization: `Bearer ${k}` }),
  },
  doubao: {
    url: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
    headerFn: (k) => ({ Authorization: `Bearer ${k}` }),
  },
  zhipu: {
    url: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    headerFn: (k) => ({ Authorization: `Bearer ${k}` }),
  },
  qwen: {
    url: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    headerFn: (k) => ({ Authorization: `Bearer ${k}` }),
  },
  chatgpt: {
    url: 'https://api.openai.com/v1/chat/completions',
    headerFn: (k) => ({ Authorization: `Bearer ${k}` }),
  },
};

// Per-provider max output token limits
const PROVIDER_MAX_TOKENS: Record<AIProvider, number> = {
  deepseek: 8192,
  doubao: 8192,
  zhipu: 8192,
  qwen: 8192,
  chatgpt: 16384,
};

export async function callAI(
  config: AIConfig,
  prompt: string,
  options?: { maxTokens?: number; temperature?: number }
): Promise<string> {
  const endpoint = PROVIDER_ENDPOINTS[config.provider];
  if (!endpoint) throw new Error(`Unknown AI provider: ${config.provider}`);
  if (!config.api_key) throw new Error('AI API key not configured');

  const requestedTokens = options?.maxTokens ?? 8000;
  const maxTokens = Math.min(requestedTokens, PROVIDER_MAX_TOKENS[config.provider]);

  const res = await fetch(endpoint.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...endpoint.headerFn(config.api_key),
    },
    body: JSON.stringify({
      model: config.model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
      temperature: options?.temperature ?? 0.8,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`AI API error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}
