import {
  ReadableStreamConstructor,
  TransformStreamConstructor,
  WritableStreamConstructor
} from '@mattiasbuelens/web-streams-polyfill';
import { createWrappingReadableStream } from './wrapping-readable-stream';
import { createWrappingWritableStream } from './wrapping-writable-stream';
import { createWrappingTransformStream } from './wrapping-transform-stream';

export interface StreamClasses {
  ReadableStream: ReadableStreamConstructor;
  WritableStream: WritableStreamConstructor;
  TransformStream: TransformStreamConstructor;
}

export function createWrappingStreams({ ReadableStream, WritableStream, TransformStream }: StreamClasses): StreamClasses {
  const WrappingReadableStream = createWrappingReadableStream(ReadableStream);
  const WrappingWritableStream = createWrappingWritableStream(WritableStream);
  const WrappingTransformStream = createWrappingTransformStream(TransformStream, WrappingReadableStream, WrappingWritableStream);

  return {
    ReadableStream: WrappingReadableStream,
    WritableStream: WrappingWritableStream,
    TransformStream: WrappingTransformStream
  };
}
