import {
  ReadableStream,
  ReadableStreamBYOBReader,
  ReadableStreamDefaultReader
} from '@mattiasbuelens/web-streams-polyfill';

export type DefaultReaderAndMode<R> = {
  mode: 'default',
  reader: ReadableStreamDefaultReader<R>
}

export type BYOBReaderAndMode = {
  mode: 'byob',
  reader: ReadableStreamBYOBReader
}

export type ReaderAndMode<R> = DefaultReaderAndMode<R> | BYOBReaderAndMode;

export function getBYOBOrDefaultReader<R>(readable: ReadableStream<R>): ReaderAndMode<R> {
  try {
    const reader = (readable as any as ReadableStream<Uint8Array>).getReader({ mode: 'byob' });
    return { reader, mode: 'byob' };
  } catch (e) {
    const reader = readable.getReader();
    return { reader, mode: 'default' };
  }
}
