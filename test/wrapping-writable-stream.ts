import {
  QueuingStrategy,
  WritableStream,
  WritableStreamConstructor,
  WritableStreamDefaultWriter,
  WritableStreamUnderlyingSink
} from '@mattiasbuelens/web-streams-polyfill';
import { createWrappingWritableSink } from '../';

export interface WrappingWritableStreamConstructor {
  new<W = any>(underlyingSink?: WritableStreamUnderlyingSink<W>,
               queuingStrategy?: Partial<QueuingStrategy>,
               wrapped?: boolean): WritableStream<W>;
}

export function createWrappingWritableStream(baseClass: WritableStreamConstructor): WrappingWritableStreamConstructor {
  const wrappingClass = class WrappingWritableStream<W = any> extends baseClass {

    constructor(underlyingSink: WritableStreamUnderlyingSink<W> = {},
                strategy: Partial<QueuingStrategy> = {}) {
      const wrappedWritableStream = new baseClass<W>(underlyingSink, { highWaterMark: 1 });
      underlyingSink = createWrappingWritableSink(wrappedWritableStream);

      super(underlyingSink, strategy);
    }

    get locked() {
      return super.locked;
    }

    abort(reason: any) {
      return super.abort(reason);
    }

    getWriter(): WritableStreamDefaultWriter<W> {
      return super.getWriter();
    }

  };

  Object.defineProperty(wrappingClass, 'name', { value: 'WritableStream' });

  return wrappingClass;
}
