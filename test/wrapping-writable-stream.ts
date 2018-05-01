import {
  QueuingStrategy,
  WritableStreamConstructor,
  WritableStreamDefaultWriter,
  WritableStreamUnderlyingSink
} from '@mattiasbuelens/web-streams-polyfill';
import { createWrappingWritableSink } from '../';

export const isWrappedWritableStream = Symbol('isWrappedWritableStream');

export type WrappedWritableStreamUnderlyingSink<W> = WritableStreamUnderlyingSink<W> & {
  [isWrappedWritableStream]?: true;
}

function isWrappedWritableStreamUnderlyingSink<W>(sink: WritableStreamUnderlyingSink<W>): sink is WrappedWritableStreamUnderlyingSink<W> {
  return (sink as WrappedWritableStreamUnderlyingSink<W>)[isWrappedWritableStream] === true;
}

export function createWrappingWritableStream(baseClass: WritableStreamConstructor): WritableStreamConstructor {
  const wrappingClass = class WrappingWritableStream<W = any> extends baseClass {

    constructor(underlyingSink: WritableStreamUnderlyingSink<W> = {},
                strategy: Partial<QueuingStrategy> = {}) {
      if (!isWrappedWritableStreamUnderlyingSink(underlyingSink)) {
        const wrappedWritableStream = new baseClass<W>(underlyingSink);
        underlyingSink = createWrappingWritableSink(wrappedWritableStream);
      }

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
