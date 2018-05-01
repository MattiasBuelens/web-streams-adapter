import {
  QueuingStrategy,
  ReadableStream,
  ReadableStreamConstructor,
  TransformStreamConstructor,
  TransformStreamTransformer,
  WritableStream,
  WritableStreamConstructor
} from '@mattiasbuelens/web-streams-polyfill';
import { createWrappingReadableSource, createWrappingTransformer, createWrappingWritableSink } from '../';
import { isWrappedReadableStream, WrappedReadableStreamUnderlyingSource } from './wrapping-readable-stream';
import { isWrappedWritableStream, WrappedWritableStreamUnderlyingSink } from './wrapping-writable-stream';

export function createWrappingTransformStream(baseClass: TransformStreamConstructor,
                                              readableClass: ReadableStreamConstructor,
                                              writableClass: WritableStreamConstructor): TransformStreamConstructor {
  const wrappingClass = class WrappingTransformStream<I = any, O = any> extends baseClass {

    private readonly _wrappedReadable: ReadableStream<O>;
    private readonly _wrappedWritable: WritableStream<I>;

    constructor(transformer: TransformStreamTransformer<I, O> = {},
                writableStrategy: Partial<QueuingStrategy> = {},
                readableStrategy: Partial<QueuingStrategy> = {}) {
      const wrappedTransformStream = new baseClass<I, O>(transformer);
      transformer = createWrappingTransformer(wrappedTransformStream);

      super(transformer);

      const wrappedReadableSource = createWrappingReadableSource(super.readable, { type: transformer.readableType }) as WrappedReadableStreamUnderlyingSource<O>;
      wrappedReadableSource[isWrappedReadableStream] = true;
      this._wrappedReadable = new readableClass<O>(wrappedReadableSource, readableStrategy);

      const wrappedWritableSink = createWrappingWritableSink(super.writable) as WrappedWritableStreamUnderlyingSink<I>;
      wrappedWritableSink[isWrappedWritableStream] = true;
      this._wrappedWritable = new writableClass<I>(wrappedWritableSink, writableStrategy);
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
