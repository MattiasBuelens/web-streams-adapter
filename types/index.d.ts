import {
  ReadableStream,
  ReadableStreamUnderlyingSource,
  WritableStream,
  WritableStreamUnderlyingSink
} from '@mattiasbuelens/web-streams-polyfill';

export declare function createWrappingReadableSource<R = any>(readable: ReadableStream<R>): ReadableStreamUnderlyingSource<R>;

export declare function createWrappingWritableSink<W = any>(writable: WritableStream<W>): WritableStreamUnderlyingSink<W>;
