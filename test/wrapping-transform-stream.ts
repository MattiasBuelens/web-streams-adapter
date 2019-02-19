/// <reference lib="dom" />
import { createWrappingReadableSource, createWrappingTransformer, createWrappingWritableSink } from '../';

export function createWrappingTransformStream(baseClass: typeof TransformStream,
                                              readableClass: typeof ReadableStream,
                                              writableClass: typeof WritableStream): typeof TransformStream {
  const wrappingClass = class WrappingTransformStream<I = any, O = any> extends baseClass<I, O> {

    private readonly _wrappedReadable: ReadableStream<O>;
    private readonly _wrappedWritable: WritableStream<I>;

    constructor(transformer: Transformer<I, O> = {},
                writableStrategy: QueuingStrategy<I> = {},
                readableStrategy: QueuingStrategy<O> = {}) {
      const wrappedTransformStream = new baseClass<I, O>(transformer);
      transformer = createWrappingTransformer<I, O>(wrappedTransformStream);

      super(transformer);

      const wrappedReadableSource = createWrappingReadableSource<O>(super.readable, { type: transformer.readableType });
      this._wrappedReadable = new readableClass<O>(wrappedReadableSource as any, readableStrategy);

      const wrappedWritableSink = createWrappingWritableSink<I>(super.writable);
      this._wrappedWritable = new writableClass<I>(wrappedWritableSink, writableStrategy);
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
