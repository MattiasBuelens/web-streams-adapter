/// <reference lib="dom" />
import { createWrappingWritableSink } from '../';

export function createWrappingWritableStream(baseClass: typeof WritableStream): typeof WritableStream {
  const wrappingClass = class WrappingWritableStream<W = any> extends baseClass<W> {

    constructor(underlyingSink: UnderlyingSink<W> = {},
                strategy: QueuingStrategy<W> = {}) {
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
