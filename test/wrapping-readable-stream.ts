import {
  PipeOptions,
  QueuingStrategy,
  ReadableByteStreamSource,
  ReadableStream,
  ReadableStreamBYOBReader,
  ReadableStreamDefaultReader,
  ReadableStreamSource,
  WritableReadablePair,
  WritableStream
} from 'whatwg-streams';
import { createWrappingReadableSource } from '../';

export function createWrappingReadableStream(baseClass: typeof ReadableStream): typeof ReadableStream {
  const wrappingClass = class WrappingReadableStream<R = any> extends baseClass<R> {

    constructor(underlyingSource: ReadableStreamSource<R> | ReadableByteStreamSource<R> = {},
                strategy: QueuingStrategy<R> = {}) {
      const wrappedReadableStream = new baseClass<R>(underlyingSource, strategy);
      underlyingSource = createWrappingReadableSource(wrappedReadableStream as any, { type: (underlyingSource as any).type });

      super(underlyingSource);
    }

    get locked() {
      return super.locked;
    }

    cancel(reason: any) {
      return super.cancel(reason);
    }

    getReader(): ReadableStreamDefaultReader<R>;
    getReader(options: { mode: 'byob' }): ReadableStreamBYOBReader<R>;
    getReader(options?: any): ReadableStreamDefaultReader<R> | ReadableStreamBYOBReader<R> {
      return super.getReader(options);
    }

    pipeThrough<T extends ReadableStream<any>>(pair: WritableReadablePair<WritableStream<R>, T>, options?: PipeOptions): T {
      return super.pipeThrough(pair, options);
    }

    pipeTo(dest: WritableStream, options: PipeOptions = {}) {
      return super.pipeTo(dest, options);
    }

    tee(): [WrappingReadableStream<R>, WrappingReadableStream<R>] {
      const [branch1, branch2] = super.tee();

      const source1 = createWrappingReadableSource<R>(branch1 as any);
      const source2 = createWrappingReadableSource<R>(branch2 as any);
      const wrapped1 = new WrappingReadableStream<R>(source1);
      const wrapped2 = new WrappingReadableStream<R>(source2);
      return [wrapped1, wrapped2];
    }
  };

  Object.defineProperty(wrappingClass, 'name', { value: 'ReadableStream' });

  return wrappingClass as typeof ReadableStream;
}
