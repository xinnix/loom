import type {
  Model,
  ProviderStreams,
  StreamOptions,
  TranscriptContext,
} from '@earendil-works/pi-ai';
import type { LlmConfigResolved, PiModelHandle } from './interfaces';

/**
 * 由 LlmConfigResolved 构建 pi model 句柄。
 *
 * MVP 仅注册 openai-completions 一条 API 路径：pi 的该适配器兼容一切
 * OpenAI 风格 /chat/completions 端点（OpenAI/DeepSeek/Qwen/vLLM/ollama 等），
 * 差异由 baseUrl 自动探测的 compat 处理。
 *
 * provider 以 configKey 命名隔离，避免多配置串 key；apiKey 由 auth.resolve
 * 在请求瞬间注入，不进入模型对象序列化路径。
 *
 * pi 包为 ESM-only（exports 无 require 条件），本项目为 CommonJS——
 * 经动态 import() 加载（模块缓存使后续调用无额外开销），因此本工厂为 async。
 */
export async function buildPiModel(config: LlmConfigResolved): Promise<PiModelHandle> {
  const pi = await import('@earendil-works/pi-ai');
  // 子路径类型见 src/types/pi-ai-subpaths.d.ts
  const openaiCompletions = await import('@earendil-works/pi-ai/api/openai-completions');

  const providerId = `loom-${config.configKey}`;
  const provider = pi.createProvider({
    id: providerId,
    name: config.name,
    baseUrl: config.apiUrl,
    auth: {
      apiKey: {
        name: 'API Key',
        resolve: async () => ({ auth: { apiKey: config.apiKey } }),
      },
    },
    models: [
      {
        id: config.model,
        name: config.model,
        api: 'openai-completions',
        provider: providerId,
        baseUrl: config.apiUrl,
        input: ['text'],
        reasoning: false,
        contextWindow: 128_000,
        maxTokens: 16_384,
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      },
    ],
    api: {
      'openai-completions': wrapStreams(openaiCompletions, config),
    },
  });

  const models = pi.createModels();
  models.setProvider(provider);
  const model = models.getModel(providerId, config.model);
  if (!model || !pi.hasApi(model, 'openai-completions')) {
    throw new Error(`pi model 构建失败: ${providerId}/${config.model}`);
  }
  return { models, model: model as Model<'openai-completions'> };
}

type OpenaiCompletionsModule = typeof import('@earendil-works/pi-ai/api/openai-completions');

/** 注入配置级默认请求参数（timeout/retries），并收敛 Model 类型差异 */
function wrapStreams(
  openaiCompletions: OpenaiCompletionsModule,
  config: LlmConfigResolved,
): ProviderStreams {
  const baseOptions = (extra?: StreamOptions): StreamOptions => ({
    timeoutMs: config.timeoutMs,
    maxRetries: config.maxRetries,
    ...extra,
  });
  return {
    stream: (model, context: TranscriptContext, options?: StreamOptions) =>
      openaiCompletions.stream(
        model as Parameters<OpenaiCompletionsModule['stream']>[0],
        context,
        baseOptions(options),
      ),
    streamSimple: (model, context, options) =>
      openaiCompletions.streamSimple(
        model as Parameters<OpenaiCompletionsModule['streamSimple']>[0],
        context,
        baseOptions(options) as SimpleStreamOptionsShape,
      ),
  };
}

type SimpleStreamOptionsShape = Parameters<OpenaiCompletionsModule['streamSimple']>[2];
