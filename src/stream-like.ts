import {
  QueuingStrategy,
  ReadableByteStreamSource,
  ReadableStreamBYOBReader,
  ReadableStreamDefaultReader,
  ReadableStreamSource,
  TransformStreamTransformer,
  WritableStreamDefaultWriter,
  WritableStreamSink
} from 'whatwg-streams';

export interface ReadableStreamLikeConstructor {
  new<R extends ArrayBufferView = ArrayBufferView>(
    underlyingSource?: ReadableByteStreamSource,
    strategy?: QueuingStrategy<R>
  ): ReadableStreamLike<R>;

  new<R = any>(
    underlyingSource?: ReadableStreamSource<R> | ReadableByteStreamSource,
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
  new<W = any>(underlyingSink?: WritableStreamSink<W>,
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
  new<R = any, W = any>(transformer?: TransformStreamTransformer<R, W>,
                        writableStrategy?: QueuingStrategy<W>,
                        readableStrategy?: QueuingStrategy<R>): TransformStreamLike<R, W>;
}

export interface TransformStreamLike<R = any, W = any>
  extends WritableReadableStreamLikePair<WritableStreamLike<W>, ReadableStreamLike<R>> {
  readonly readable: ReadableStreamLike<R>;
  readonly writable: WritableStreamLike<W>;
}
