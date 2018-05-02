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

  cancel(reason: any): Promise<void>;

  // TODO 'byob' mode is available iff underlyingSource extends ReadableByteStreamStreamUnderlyingSource
  getReader(options: { mode: (R extends Uint8Array ? 'byob' : never) }): ReadableStreamBYOBReader;

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

export interface TransformStreamLike<I = any, O = any> extends ReadableWritableStreamPair<O, I> {
}

export interface WrappingReadableSourceOptions {
  type?: 'bytes';
}

export declare function createWrappingReadableSource<R = any>(readable: ReadableStreamLike<R>, options?: WrappingReadableSourceOptions): ReadableStreamUnderlyingSource<R>;

export declare function createWrappingWritableSink<W = any>(writable: WritableStreamLike<W>): WritableStreamUnderlyingSink<W>;

export declare function createWrappingTransformer<I = any, O = any>(transform: TransformStreamLike<I, O>): TransformStreamTransformer<I, O>;
