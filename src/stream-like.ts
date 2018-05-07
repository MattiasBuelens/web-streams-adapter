import {
  QueuingStrategy,
  ReadableStreamBYOBReader,
  ReadableStreamDefaultReader,
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

  getWriter(): WritableStreamDefaultWriter<W>;
}

export interface TransformStreamLikeConstructor {
  new<I = any, O = any>(transformer?: TransformStreamTransformer<I, O>,
                        writableStrategy?: Partial<QueuingStrategy>,
                        readableStrategy?: Partial<QueuingStrategy>): TransformStreamLike<I, O>;
}

export type TransformStreamLike<I = any, O = any> = ReadableWritableStreamPair<O, I>;
