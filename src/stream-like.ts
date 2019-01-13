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

export interface WritableReadableStreamLikePair<W extends WritableStreamLike<any>, R extends ReadableStreamLike<any>> {
  readonly readable: R;
  readonly writable: W;
}

export interface TransformStreamLikeConstructor {
  new<R = any, W = any>(transformer?: Transformer<W, R>,
                        writableStrategy?: QueuingStrategy<W>,
                        readableStrategy?: QueuingStrategy<R>): TransformStreamLike<R, W>;
}

export interface TransformStreamLike<R = any, W = any>
  extends WritableReadableStreamLikePair<WritableStreamLike<W>, ReadableStreamLike<R>> {
  readonly readable: ReadableStreamLike<R>;
  readonly writable: WritableStreamLike<W>;
}
