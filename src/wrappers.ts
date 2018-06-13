import { ReadableStreamLike, TransformStreamLike, WritableStreamLike } from './stream-like';

export interface WrappingReadableSourceOptions {
  type?: 'bytes';
}

export type ReadableStreamWrapper = <R>(readable: ReadableStreamLike<R>,
                                        options?: WrappingReadableSourceOptions) => ReadableStreamLike<R>;

export type TransformStreamWrapper = <I, O>(Transform: TransformStreamLike<I, O>) => TransformStreamLike<I, O>;

export type WritableStreamWrapper = <W>(writable: WritableStreamLike<W>) => WritableStreamLike<W>;
