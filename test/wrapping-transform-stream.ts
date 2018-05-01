import {
  QueuingStrategy,
  ReadableStream,
  TransformStreamConstructor,
  TransformStreamTransformer,
  WritableStream
} from '@mattiasbuelens/web-streams-polyfill';
import { createWrappingReadableSource, createWrappingTransformer, createWrappingWritableSink } from '../';
import { WrappingReadableStreamConstructor } from './wrapping-readable-stream';
import { WrappingWritableStreamConstructor } from './wrapping-writable-stream';

export function createWrappingTransformStream(baseClass: TransformStreamConstructor,
                                              readableClass: WrappingReadableStreamConstructor,
                                              writableClass: WrappingWritableStreamConstructor): TransformStreamConstructor {
  const wrappingClass = class WrappingTransformStream<I = any, O = any> extends baseClass {

    private readonly _wrappedReadable: ReadableStream<O>;
    private readonly _wrappedWritable: WritableStream<I>;

    constructor(transformer: TransformStreamTransformer<I, O> = {},
                writableStrategy: Partial<QueuingStrategy> = {},
                readableStrategy: Partial<QueuingStrategy> = {}) {
      const wrappedTransformStream = new baseClass<I, O>(transformer);
      transformer = createWrappingTransformer(wrappedTransformStream);

      super(transformer, writableStrategy, readableStrategy);

      const wrappedReadableSource = createWrappingReadableSource(super.readable, { type: transformer.readableType });
      this._wrappedReadable = new readableClass(wrappedReadableSource, {}, true);

      const wrappedWritableSink = createWrappingWritableSink(super.writable);
      this._wrappedWritable = new writableClass(wrappedWritableSink, {}, true);
    }

    get readable() {
      this._wrappingTransformStreamBrandCheck();
      return this._wrappedReadable;
    }

    get writable() {
      this._wrappingTransformStreamBrandCheck();
      return this._wrappedWritable;
    }

    private _wrappingTransformStreamBrandCheck() {
      return super.readable;
    }

  };

  Object.defineProperty(wrappingClass, 'name', { value: 'TransformStream' });

  return wrappingClass;
}
