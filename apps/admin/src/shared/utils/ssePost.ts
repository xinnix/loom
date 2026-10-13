/**
 * SSE over POST：fetch POST + ReadableStream 手解析 data: 帧。
 * EventSource 不支持 POST 与 Authorization 头，Playground 走此通道。
 */
export interface SsePostOptions {
  url: string;
  body: unknown;
  onEvent: (data: unknown) => void;
  onError?: (error: Error) => void;
  onDone?: () => void;
  signal?: AbortSignal;
}

export async function ssePost({
  url,
  body,
  onEvent,
  onError,
  onDone,
  signal,
}: SsePostOptions): Promise<void> {
  const token = localStorage.getItem('accessToken');
  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
      signal,
    });
  } catch (err) {
    onError?.(err as Error);
    return;
  }

  if (!response.ok || !response.body) {
    let message = `HTTP ${response.status}`;
    try {
      const text = await response.text();
      const parsed = JSON.parse(text);
      message = parsed.message ?? message;
    } catch {
      // 非 JSON 错误体
    }
    onError?.(new Error(message));
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const frames = buffer.split('\n\n');
      buffer = frames.pop() ?? '';
      for (const frame of frames) {
        for (const line of frame.split('\n')) {
          if (line.startsWith('data: ')) {
            try {
              onEvent(JSON.parse(line.slice(6)));
            } catch {
              // 忽略非 JSON 帧
            }
          }
        }
      }
    }
    onDone?.();
  } catch (err) {
    if ((err as Error).name !== 'AbortError') onError?.(err as Error);
  }
}
