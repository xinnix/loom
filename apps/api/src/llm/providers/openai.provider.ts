import { Injectable, Logger } from '@nestjs/common';
import type { LlmProvider } from '../interfaces/llm-provider.interface';
import type { LlmChatParams, LlmChatResult } from '../interfaces/llm.types';

interface OpenaiChatCompletionRequest {
  model: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  max_tokens?: number;
  stop?: string[];
  stream?: boolean;
}

interface OpenaiChatCompletionResponse {
  id: string;
  object: string;
  model: string;
  choices: Array<{
    index: number;
    message: { role: string; content: string };
    finish_reason: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface OpenaiStreamChunk {
  choices?: Array<{
    delta: { content?: string };
    finish_reason: string | null;
  }>;
}

/**
 * OpenAI 兼容 API 的 LLM 提供商实现
 *
 * 支持任何兼容 OpenAI 格式的 API（OpenAI、Azure OpenAI、vLLM、ollama 等）。
 * 通过环境变量或 LlmModule.forRoot() 配置 endpoint 和 API Key。
 */
@Injectable()
export class OpenaiProvider implements LlmProvider {
  readonly name = 'openai';

  private readonly logger = new Logger(OpenaiProvider.name);

  constructor(private readonly config: { apiUrl: string; apiKey: string }) {}

  async chat(params: LlmChatParams): Promise<LlmChatResult> {
    const url = `${this.config.apiUrl}/chat/completions`;
    const body: OpenaiChatCompletionRequest = {
      model: params.model!,
      messages: params.messages.map((m) => ({ role: m.role, content: m.content })),
      ...(params.temperature !== undefined && { temperature: params.temperature }),
      ...(params.maxTokens !== undefined && { max_tokens: params.maxTokens }),
      ...(params.stop !== undefined && params.stop.length > 0 && { stop: params.stop }),
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(`OpenAI API error: ${response.status} ${errorText}`);
      throw new Error(`LLM API error (${response.status}): ${errorText}`);
    }

    const data = (await response.json()) as OpenaiChatCompletionResponse;
    const choice = data.choices?.[0];

    return {
      content: choice?.message?.content ?? '',
      model: data.model ?? params.model,
      usage: data.usage
        ? {
            promptTokens: data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens,
            totalTokens: data.usage.total_tokens,
          }
        : undefined,
      finishReason: choice?.finish_reason ?? undefined,
    };
  }

  async *chatStream(params: LlmChatParams): AsyncGenerator<string> {
    const url = `${this.config.apiUrl}/chat/completions`;
    const body: OpenaiChatCompletionRequest = {
      model: params.model!,
      messages: params.messages.map((m) => ({ role: m.role, content: m.content })),
      stream: true,
      ...(params.temperature !== undefined && { temperature: params.temperature }),
      ...(params.maxTokens !== undefined && { max_tokens: params.maxTokens }),
      ...(params.stop !== undefined && params.stop.length > 0 && { stop: params.stop }),
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(`OpenAI API stream error: ${response.status} ${errorText}`);
      throw new Error(`LLM API error (${response.status}): ${errorText}`);
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
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          const jsonStr = trimmed.slice(6).trim();
          if (!jsonStr || jsonStr === '[DONE]') continue;

          try {
            const event = JSON.parse(jsonStr) as OpenaiStreamChunk;
            const delta = event.choices?.[0]?.delta?.content;
            if (delta) yield delta;
          } catch {
            // skip malformed JSON lines
          }
        }
      }

      // Process remaining buffer
      const remaining = buffer.trim();
      if (remaining.startsWith('data: ')) {
        const jsonStr = remaining.slice(6).trim();
        if (jsonStr && jsonStr !== '[DONE]') {
          try {
            const event = JSON.parse(jsonStr) as OpenaiStreamChunk;
            const delta = event.choices?.[0]?.delta?.content;
            if (delta) yield delta;
          } catch {
            // skip malformed JSON
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}
