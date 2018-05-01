import {
  QueuingStrategy,
  TransformStreamConstructor,
  TransformStreamTransformer
} from '@mattiasbuelens/web-streams-polyfill';
import { createWrappingTransformer } from '../';

export function createWrappingTransformStream(baseClass: TransformStreamConstructor): TransformStreamConstructor {
  const wrappingClass = class WrappingTransformStream<I = any, O = any> extends baseClass {

    constructor(transformer: TransformStreamTransformer<I, O> = {},
                writableStrategy: Partial<QueuingStrategy> = {},
                readableStrategy: Partial<QueuingStrategy> = {}) {
      const wrappedTransformStream = new baseClass<I, O>(transformer);
      transformer = createWrappingTransformer(wrappedTransformStream);

      super(transformer, writableStrategy, readableStrategy);
    }

    get readable() {
      return super.readable;
    }

    get writable() {
      return super.writable;
    }

  };

  Object.defineProperty(wrappingClass, 'name', { value: 'TransformStream' });

  return wrappingClass;
}
