import {
  QueuingStrategy,
  ReadableStream,
  TransformStream,
  TransformStreamTransformer,
  WritableStream
} from 'whatwg-streams';
import { createWrappingReadableSource, createWrappingTransformer, createWrappingWritableSink } from '../';

export function createWrappingTransformStream(baseClass: typeof TransformStream,
                                              readableClass: typeof ReadableStream,
                                              writableClass: typeof WritableStream): typeof TransformStream {
  const wrappingClass = class WrappingTransformStream<R = any, W = any> extends baseClass<R, W> {

    private readonly _wrappedReadable: ReadableStream<R>;
    private readonly _wrappedWritable: WritableStream<W>;

    constructor(transformer: TransformStreamTransformer<R, W> = {},
                writableStrategy: QueuingStrategy<W> = {},
                readableStrategy: QueuingStrategy<R> = {}) {
      const wrappedTransformStream = new baseClass<R, W>(transformer);
      transformer = createWrappingTransformer(wrappedTransformStream as any);

      super(transformer);

      const wrappedReadableSource = createWrappingReadableSource(super.readable as any, { type: (transformer as any).readableType });
      this._wrappedReadable = new readableClass<R>(wrappedReadableSource, readableStrategy);

      const wrappedWritableSink = createWrappingWritableSink(super.writable);
      this._wrappedWritable = new writableClass<W>(wrappedWritableSink, writableStrategy);
    }

    get readable() {
      void super.readable; // brand check
      return this._wrappedReadable;
    }

    get writable() {
      void super.writable; // brand check
      return this._wrappedWritable;
    }

  };

  Object.defineProperty(wrappingClass, 'name', { value: 'TransformStream' });

  return wrappingClass;
}
