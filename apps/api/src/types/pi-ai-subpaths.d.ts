/**
 * pi-ai 子路径导出的类型声明。
 *
 * 项目 tsconfig 为 moduleResolution: "node"（Node10 风格），不解析 package.json
 * exports，而 pi-ai 的物理目录只有 dist/。运行时 Node require 走 exports 正常；
 * 此文件补齐类型解析。若将来 tsconfig 升级为 node16/bundler，本文件可删除。
 */
declare module '@earendil-works/pi-ai/api/openai-completions' {
  import type {
    AssistantMessageEventStream,
    Model,
    OpenAICompletionsOptions,
    SimpleStreamOptions,
    StreamOptions,
    TranscriptContext,
  } from '@earendil-works/pi-ai';

  export declare const stream: (
    model: Model<'openai-completions'>,
    context: TranscriptContext,
    options?: StreamOptions & OpenAICompletionsOptions,
  ) => AssistantMessageEventStream;

  export declare const streamSimple: (
    model: Model<'openai-completions'>,
    context: TranscriptContext,
    options?: SimpleStreamOptions,
  ) => AssistantMessageEventStream;
}

declare module '@earendil-works/pi-ai/providers/faux' {
  import type {
    AssistantMessage,
    Models,
    Model,
    Provider,
    SimpleStreamOptions,
    TranscriptContext,
  } from '@earendil-works/pi-ai';

  export declare function fauxText(text: string): { type: 'text'; text: string };
  export declare function fauxThinking(thinking: string): { type: 'thinking'; thinking: string };
  export declare function fauxToolCall(
    name: string,
    args: Record<string, unknown>,
    options?: { id?: string },
  ): { type: 'toolCall'; id: string; name: string; arguments: Record<string, unknown> };
  export declare function fauxAssistantMessage(
    content: string | ReturnType<typeof fauxText | typeof fauxThinking | typeof fauxToolCall>[],
    options?: { stopReason?: AssistantMessage['stopReason']; errorMessage?: string },
  ): AssistantMessage;
  export interface FauxProviderHandle {
    provider: Provider;
    api: string;
    models: [Model<string>, ...Model<string>[]];
    getModel(): Model<string>;
    setResponses(
      responses: (AssistantMessage | ((context: TranscriptContext) => AssistantMessage))[],
    ): void;
    appendResponses(responses: AssistantMessage[]): void;
  }
  export declare function fauxProvider(options?: {
    models?: { id: string; name?: string }[];
    tokensPerSecond?: number;
  }): FauxProviderHandle;
  export declare function createFauxCore(options?: {
    models?: { id: string; name?: string }[];
  }): FauxProviderHandle & {
    streamSimple: (
      model: Model<string>,
      context: TranscriptContext,
      options?: SimpleStreamOptions,
    ) => AsyncIterable<unknown>;
  };
  export declare const _unusedModels: Models | undefined;
}
