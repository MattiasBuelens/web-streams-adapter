import {
  ReadableStream,
  ReadableStreamUnderlyingSource,
  TransformStream,
  TransformStreamTransformer,
  WritableStream,
  WritableStreamUnderlyingSink
} from '@mattiasbuelens/web-streams-polyfill';

export interface WrappingReadableSourceOptions {
  type?: 'bytes';
}

export declare function createWrappingReadableSource<R = any>(readable: ReadableStream<R>, options?: WrappingReadableSourceOptions): ReadableStreamUnderlyingSource<R>;

export declare function createWrappingWritableSink<W = any>(writable: WritableStream<W>): WritableStreamUnderlyingSink<W>;

export declare function createWrappingTransformer<I = any, O = any>(writable: TransformStream<I, O>): TransformStreamTransformer<I, O>;
