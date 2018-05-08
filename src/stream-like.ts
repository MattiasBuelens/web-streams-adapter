import {
  QueuingStrategy,
  ReadableStreamUnderlyingSource,
  TransformStreamTransformer,
  WritableStreamUnderlyingSink
} from '@mattiasbuelens/web-streams-polyfill';

export interface ReadableStreamLikeConstructor {
  new<R = any>(underlyingSource?: ReadableStreamUnderlyingSource<R>,
               strategy?: Partial<QueuingStrategy>): ReadableStreamLike<R>;
}

export interface ReadableStreamLike<R = any> {
  readonly locked: boolean;

  // TODO 'byob' mode is available iff underlyingSource extends ReadableByteStreamStreamUnderlyingSource
  getReader(options: { mode: 'byob' }): ReadableStreamLikeBYOBReader;

  getReader(options?: { mode?: undefined }): ReadableStreamLikeDefaultReader<R>;
}

export type ReadableByteStreamLike = ReadableStreamLike<Uint8Array>;

export interface ReadableStreamLikeReaderBase {
  readonly closed: Promise<void>;

  cancel(reason: any): Promise<void>;

  releaseLock(): void;
}

export interface ReadableStreamLikeDefaultReader<R = any> extends ReadableStreamLikeReaderBase {
  read(): Promise<IteratorResult<R>>;
}

export interface ReadableStreamLikeBYOBReader extends ReadableStreamLikeReaderBase {
  read<T extends ArrayBufferView>(view: T): Promise<IteratorResult<T>>;
}

export interface WritableStreamLikeConstructor {
  new<W = any>(underlyingSink?: WritableStreamUnderlyingSink<W>,
               strategy?: Partial<QueuingStrategy>): WritableStreamLike<W>;
}

export interface WritableStreamLike<W = any> {
  readonly locked: boolean;

  getWriter(): WritableStreamLikeDefaultWriter<W>;
}

export interface WritableStreamLikeDefaultWriter<W = any> {
  readonly closed: Promise<void>;
  readonly desiredSize: number | null;
  readonly ready: Promise<void>;

  abort(reason: any): Promise<void>;

  close(): Promise<void>;

  releaseLock(): void;

  write(chunk: W): Promise<void>;
}

export interface ReadableWritableStreamLikePair<R = any, W = any> {
  readonly readable: ReadableStreamLike<R>;
  readonly writable: WritableStreamLike<W>;
}

export interface TransformStreamLikeConstructor {
  new<I = any, O = any>(transformer?: TransformStreamTransformer<I, O>,
                        writableStrategy?: Partial<QueuingStrategy>,
                        readableStrategy?: Partial<QueuingStrategy>): TransformStreamLike<I, O>;
}

export type TransformStreamLike<I = any, O = any> = ReadableWritableStreamLikePair<O, I>;
