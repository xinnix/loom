import { Injectable, Logger } from '@nestjs/common';

export interface LlmMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
}

export interface LlmChatParams {
  /** API base URL，默认读环境变量 LLM_API_URL */
  apiUrl?: string;
  /** API Key，默认读环境变量 LLM_API_KEY */
  apiKey?: string;
  /** 模型名，默认读环境变量 LLM_MODEL 或 gpt-4o */
  model?: string;
  messages: LlmMessage[];
  /** 温度 0-2，默认 0.7 */
  temperature?: number;
  /** 最大生成 token 数 */
  maxTokens?: number;
}

export interface LlmChatResult {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);

  private getDefaultApiUrl(): string {
    return process.env.LLM_API_URL || 'https://api.openai.com/v1';
  }

  private getDefaultApiKey(): string {
    const key = process.env.LLM_API_KEY;
    if (!key) {
      throw new Error('LLM_API_KEY 环境变量未配置');
    }
    return key;
  }

  private getDefaultModel(): string {
    return process.env.LLM_MODEL || 'gpt-4o';
  }

  /**
   * 非流式聊天补全
   */
  async chat(params: LlmChatParams): Promise<LlmChatResult> {
    const apiUrl = params.apiUrl || this.getDefaultApiUrl();
    const apiKey = params.apiKey || this.getDefaultApiKey();
    const model = params.model || this.getDefaultModel();

    const response = await fetch(`${apiUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: params.messages,
        temperature: params.temperature ?? 0.7,
        ...(params.maxTokens && { max_tokens: params.maxTokens }),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(`LLM API error: ${response.status} ${errorText}`);
      throw new Error(`LLM API error: ${response.status}`);
    }

    const data = (await response.json()) as any;
    const choice = data.choices?.[0];

    return {
      content: choice?.message?.content ?? '',
      model: data.model ?? model,
      usage: data.usage
        ? {
            promptTokens: data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens,
            totalTokens: data.usage.total_tokens,
          }
        : undefined,
    };
  }

  /**
   * 流式聊天补全（SSE），逐 token yield
   */
  async *chatStream(params: LlmChatParams): AsyncGenerator<string> {
    const apiUrl = params.apiUrl || this.getDefaultApiUrl();
    const apiKey = params.apiKey || this.getDefaultApiKey();
    const model = params.model || this.getDefaultModel();

    const response = await fetch(`${apiUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: params.messages,
        temperature: params.temperature ?? 0.7,
        stream: true,
        ...(params.maxTokens && { max_tokens: params.maxTokens }),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(`LLM API stream error: ${response.status} ${errorText}`);
      throw new Error(`LLM API error: ${response.status}`);
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6).trim();
            if (!jsonStr || jsonStr === '[DONE]') continue;
            try {
              const event = JSON.parse(jsonStr);
              const delta = event.choices?.[0]?.delta?.content;
              if (delta) yield delta;
            } catch {
              // skip malformed JSON
            }
          }
        }
      }

      // Process remaining buffer
      if (buffer.startsWith('data: ')) {
        const jsonStr = buffer.slice(6).trim();
        if (jsonStr && jsonStr !== '[DONE]') {
          try {
            const event = JSON.parse(jsonStr);
            const delta = event.choices?.[0]?.delta?.content;
            if (delta) yield delta;
          } catch {}
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}
