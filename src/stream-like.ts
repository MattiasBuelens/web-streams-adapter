export interface ReadableStreamLikeConstructor {
  new(
    underlyingSource: UnderlyingByteSource,
    strategy?: { highWaterMark?: number; size?: undefined; }
  ): ReadableByteStreamLike;

  new<R = any>(
    underlyingSource?: UnderlyingSource<R>,
    strategy?: QueuingStrategy<R>
  ): ReadableStreamLike<R>;
}

export interface ReadableStreamLike<R = any> {
  readonly locked: boolean;

  getReader(): ReadableStreamDefaultReader<R>;
}

export interface ReadableByteStreamLike extends ReadableStreamLike<ArrayBufferView> {
  getReader(): ReadableStreamDefaultReader<ArrayBufferView>;

  // TODO 'byob' mode is available iff underlyingSource extends ReadableByteStreamStreamUnderlyingSource
  getReader({ mode }: { mode: 'byob' }): ReadableStreamBYOBReader;
}

export interface UnderlyingByteSource {
  start?: UnderlyingByteSourceStartCallback;
  pull?: UnderlyingByteSourcePullCallback;
  cancel?: UnderlyingSourceCancelCallback;
  type: 'bytes';
  autoAllocateChunkSize?: number;
}

export type UnderlyingByteSourcePullCallback = (controller: ReadableByteStreamController) => void | PromiseLike<void>;

export type UnderlyingByteSourceStartCallback = (controller: ReadableByteStreamController) => void | PromiseLike<void>;

export interface ReadableByteStreamController {
  readonly byobRequest: ReadableStreamBYOBRequest | null;
  readonly desiredSize: number | null;

  close(): void;

  enqueue(chunk: ArrayBufferView): void;

  error(e?: any): void;
}

export interface ReadableStreamBYOBRequest {
  readonly view: ArrayBufferView | null;

  respond(bytesWritten: number): void;

  respondWithNewView(view: ArrayBufferView): void;
}

export interface ReadableStreamBYOBReader {
  readonly closed: Promise<void>;

  cancel(reason?: any): Promise<void>;

  read<T extends ArrayBufferView>(view: T): Promise<ReadableStreamBYOBReadResult<T>>;

  releaseLock(): void;
}

export type ReadableStreamBYOBReadResult<T extends ArrayBufferView> = {
  done: boolean;
  value: T;
};

export interface WritableStreamLikeConstructor {
  new<W = any>(underlyingSink?: UnderlyingSink<W>,
               strategy?: QueuingStrategy<W>): WritableStreamLike<W>;
}

export interface WritableStreamLike<W = any> {
  readonly locked: boolean;

  getWriter(): WritableStreamDefaultWriter<W>;
}

export interface TransformStreamLikeConstructor {
  new<I = any, O = any>(transformer?: Transformer<I, O>,
                        writableStrategy?: QueuingStrategy<I>,
                        readableStrategy?: QueuingStrategy<O>): TransformStreamLike<I, O>;
}

export interface TransformStreamLike<I = any, O = any> {
  readonly writable: WritableStreamLike<I>;
  readonly readable: ReadableStreamLike<O>;
}
