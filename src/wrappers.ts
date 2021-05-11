import { ReadableByteStreamLike, ReadableStreamLike, TransformStreamLike, WritableStreamLike } from './stream-like';

export type ReadableStreamWrapper = <R>(readable: ReadableStreamLike<R>,
                                        options?: { type?: undefined }) => ReadableStreamLike<R>;

export interface ReadableByteStreamWrapper {
  (readable: ReadableByteStreamLike, options: { type: 'bytes' }): ReadableByteStreamLike;

  <R>(readable: ReadableStreamLike<R>, options?: { type?: undefined }): ReadableStreamLike<R>;
}

export type TransformStreamWrapper = <I, O>(Transform: TransformStreamLike<I, O>) => TransformStreamLike<I, O>;

export type WritableStreamWrapper = <W>(writable: WritableStreamLike<W>) => WritableStreamLike<W>;
