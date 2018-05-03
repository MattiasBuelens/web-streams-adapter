import {
  QueuingStrategy,
  WritableStreamConstructor,
  WritableStreamDefaultWriter,
  WritableStreamUnderlyingSink
} from '@mattiasbuelens/web-streams-polyfill';
import { createWrappingWritableSink } from '../';

export function createWrappingWritableStream(baseClass: WritableStreamConstructor): WritableStreamConstructor {
  const wrappingClass = class WrappingWritableStream<W = any> extends baseClass {

    constructor(underlyingSink: WritableStreamUnderlyingSink<W> = {},
                strategy: Partial<QueuingStrategy> = {}) {
      const wrappedWritableStream = new baseClass<W>(underlyingSink);
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
