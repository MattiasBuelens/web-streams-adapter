export interface ReadableStreamLikeConstructor {
  new<R extends ArrayBufferView = ArrayBufferView>(
    underlyingSource?: UnderlyingByteSource,
    strategy?: QueuingStrategy<R>
  ): ReadableStreamLike<R>;

  new<R = any>(
    underlyingSource?: UnderlyingSource<R> | UnderlyingByteSource,
    strategy?: QueuingStrategy<R>
  ): ReadableStreamLike<R>;
}

export interface ReadableStreamLike<R = any> {
  readonly locked: boolean;

  getReader(): ReadableStreamDefaultReader<R>;

  // TODO 'byob' mode is available iff underlyingSource extends ReadableByteStreamStreamUnderlyingSource
  getReader({ mode }: { mode: 'byob' }): ReadableStreamBYOBReader;
}

export type ReadableByteStreamLike = ReadableStreamLike<ArrayBufferView>;

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
