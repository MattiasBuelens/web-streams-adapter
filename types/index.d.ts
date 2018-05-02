import {
  QueuingStrategy,
  ReadableByteStreamStreamUnderlyingSource,
  ReadableStreamBYOBReader,
  ReadableStreamDefaultReader,
  ReadableStreamDefaultUnderlyingSource,
  ReadableStreamUnderlyingSource,
  ReadableWritableStreamPair,
  TransformStreamTransformer,
  WritableStreamDefaultWriter,
  WritableStreamUnderlyingSink
} from '@mattiasbuelens/web-streams-polyfill';

export interface ReadableStreamLikeConstructor {
  new<R = any>(underlyingSource?: ReadableStreamUnderlyingSource<R>,
               strategy?: Partial<QueuingStrategy>): ReadableStreamLike<R>;
}

export interface ReadableStreamLike<R = any> {
  readonly locked: boolean;

  cancel(reason: any): Promise<void>;

  // TODO 'byob' mode is available iff underlyingSource extends ReadableByteStreamStreamUnderlyingSource
  getReader(options: { mode: 'byob' }): ReadableStreamBYOBReader;

  getReader(options?: { mode?: undefined }): ReadableStreamDefaultReader<R>;
}

export type ReadableByteStreamLike = ReadableStreamLike<Uint8Array>;

export interface WritableStreamLikeConstructor {
  new<W = any>(underlyingSink?: WritableStreamUnderlyingSink<W>,
               strategy?: Partial<QueuingStrategy>): WritableStreamLike<W>;
}

export interface WritableStreamLike<W = any> {
  readonly locked: boolean;

  abort(reason: any): Promise<void>;

  getWriter(): WritableStreamDefaultWriter<W>;
}

export interface TransformStreamLikeConstructor {
  new<I = any, O = any>(transformer?: TransformStreamTransformer<I, O>,
                        writableStrategy?: Partial<QueuingStrategy>,
                        readableStrategy?: Partial<QueuingStrategy>): TransformStreamLike<I, O>;
}

export type TransformStreamLike<I = any, O = any> = ReadableWritableStreamPair<O, I>;

/*
 * High-level API
 */

export interface WrappingReadableSourceOptions {
  type?: 'bytes';
}

export type ReadableStreamWrapper = <R>(readable: ReadableStreamLike<R>, options?: WrappingReadableSourceOptions) => ReadableStreamLike<R>;

export type TransformStreamWrapper = <I, O>(Transform: TransformStreamLike<I, O>) => TransformStreamLike<I, O>;

export type WritableStreamWrapper = <W>(writable: WritableStreamLike<W>) => WritableStreamLike<W>;

export function createReadableStreamWrapper(ctor: ReadableStreamLikeConstructor): ReadableStreamWrapper;

export function createWritableStreamWrapper(ctor: WritableStreamLikeConstructor): WritableStreamWrapper;

export function createTransformStreamWrapper(ctor: TransformStreamLikeConstructor): TransformStreamWrapper;

/*
 * Low-level API
 */

export declare function createWrappingReadableSource(readable: ReadableStreamLike<Uint8Array>, options: { type: 'bytes' }): ReadableByteStreamStreamUnderlyingSource;
export declare function createWrappingReadableSource<R = any>(readable: ReadableStreamLike<R>, options?: { type?: undefined }): ReadableStreamDefaultUnderlyingSource<R>;
export declare function createWrappingReadableSource<R = any>(readable: ReadableStreamLike<R>, options?: WrappingReadableSourceOptions): ReadableStreamUnderlyingSource<R>;

export declare function createWrappingWritableSink<W = any>(writable: WritableStreamLike<W>): WritableStreamUnderlyingSink<W>;

export declare function createWrappingTransformer<I = any, O = any>(transform: TransformStreamLike<I, O>): TransformStreamTransformer<I, O>;
