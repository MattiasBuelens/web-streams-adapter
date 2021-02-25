/// <reference lib="dom" />
import { createWrappingReadableSource, ReadableStreamBYOBReader, UnderlyingByteSource } from '../';

export function createWrappingReadableStream(baseClass: typeof ReadableStream): typeof ReadableStream {
  const wrappingClass = class WrappingReadableStream<R = any> extends baseClass<R> {

    constructor(underlyingSource: UnderlyingSource<R> | UnderlyingByteSource = {},
                strategy: QueuingStrategy<R> = {}) {
      let wrappedReadableStream = new baseClass<R>(underlyingSource as any, strategy);
      underlyingSource = createWrappingReadableSource(wrappedReadableStream, { type: underlyingSource.type });

      super(underlyingSource as any);
    }

    get locked() {
      return super.locked;
    }

    cancel(reason: any) {
      return super.cancel(reason);
    }

    getReader(): ReadableStreamDefaultReader<R>;
    getReader(options: { mode: 'byob' }): ReadableStreamBYOBReader;
    getReader(options?: any): ReadableStreamDefaultReader<R> | ReadableStreamBYOBReader {
      return (super.getReader as any)(options);
    }

    pipeThrough<T>(pair: { writable: WritableStream<R>, readable: ReadableStream<T> }, options?: StreamPipeOptions): ReadableStream<T> {
      return super.pipeThrough(pair, options);
    }

    pipeTo(dest: WritableStream<R>, options: StreamPipeOptions = {}) {
      return super.pipeTo(dest, options);
    }

    tee(): [WrappingReadableStream<R>, WrappingReadableStream<R>] {
      const [branch1, branch2] = super.tee();

      const source1 = createWrappingReadableSource<R>(branch1);
      const source2 = createWrappingReadableSource<R>(branch2);
      const wrapped1 = new WrappingReadableStream<R>(source1);
      const wrapped2 = new WrappingReadableStream<R>(source2);
      return [wrapped1, wrapped2];
    }
  };

  Object.defineProperty(wrappingClass, 'name', { value: 'ReadableStream' });

  return wrappingClass;
}
