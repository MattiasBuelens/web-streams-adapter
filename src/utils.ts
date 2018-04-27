import { ReadableStream } from '@mattiasbuelens/web-streams-polyfill';

export function supportsByobReader<R>(readable: ReadableStream<R>): boolean {
  try {
    const reader = (readable as any as ReadableStream<Uint8Array>).getReader({ mode: 'byob' });
    reader.releaseLock();
    return true;
  } catch {
    return false;
  }
}
