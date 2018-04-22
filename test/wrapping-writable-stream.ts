import {
  QueuingStrategy,
  WritableStream,
  WritableStreamConstructor,
  WritableStreamDefaultWriter,
  WritableStreamUnderlyingSink
} from '@mattiasbuelens/web-streams-polyfill';
import { createWrappingWritableSink } from '../';

export function createWrappingWritableStream(baseClass: WritableStreamConstructor): WritableStreamConstructor {
  const wrappingClass = class WrappingWritableStream<W = any> extends WritableStream<W> {

    constructor(underlyingSink: WritableStreamUnderlyingSink<W> = {}, { size, highWaterMark }: Partial<QueuingStrategy> = {}) {
      const wrappedWritableStream = new baseClass<W>(underlyingSink, { highWaterMark: 1 });
      underlyingSink = createWrappingWritableSink(wrappedWritableStream);

      super(underlyingSink, { size, highWaterMark });
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
