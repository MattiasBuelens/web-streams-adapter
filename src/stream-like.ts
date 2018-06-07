import {
  QueuingStrategy,
  ReadableByteStreamSource,
  ReadableStreamBYOBReader,
  ReadableStreamDefaultReader,
  ReadableStreamSource,
  TransformStreamDefaultController,
  WritableStreamDefaultWriter,
  WritableStreamSink
} from 'whatwg-streams';

export interface ReadableStreamLikeConstructor {
  new<R = any>(underlyingSource?: ReadableStreamSource<R>,
               strategy?: QueuingStrategy<R>): ReadableStreamLike<R>;

  new<R = ArrayBufferView>(underlyingSource?: ReadableByteStreamSource<R>,
                           strategy?: QueuingStrategy<R>): ReadableStreamLike<R>;
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
  new<I = any, O = any>(transformer?: TransformStreamTransformer<I, O>,
                        writableStrategy?: QueuingStrategy<I>,
                        readableStrategy?: QueuingStrategy<O>): TransformStreamLike<I, O>;
}

export interface TransformStreamLike<I = any, O = any> extends WritableReadableStreamLikePair<WritableStreamLike<I>, ReadableStreamLike<O>> {
  readonly readable: ReadableStreamLike<O>;
  readonly writable: WritableStreamLike<I>;
}

// TODO Upstream fixed type parameters to @types/whatwg-streams
export interface TransformStreamTransformer<I = any, O = any> {
  start?(controller: TransformStreamDefaultController<O>): void | Promise<void>;

  transform?(chunk: I, controller: TransformStreamDefaultController<O>): void | Promise<void>;

  flush?(controller: TransformStreamDefaultController<O>): void | Promise<void>;
}
