import {
  QueuingStrategy,
  ReadableStream,
  ReadableStreamBYOBReader,
  ReadableStreamConstructor,
  ReadableStreamDefaultReader,
  ReadableStreamPipeOptions,
  ReadableStreamUnderlyingSource,
  ReadableWritableStreamPair,
  WritableStream
} from '@mattiasbuelens/web-streams-polyfill';
import { createWrappingReadableSource } from '../';

export const isWrappedReadableStream = Symbol('isWrappedReadableStream');

export type WrappedReadableStreamUnderlyingSource<R> = ReadableStreamUnderlyingSource<R> & {
  [isWrappedReadableStream]?: true;
}

function isWrappedReadableStreamUnderlyingSource<R>(source: ReadableStreamUnderlyingSource<R>): source is WrappedReadableStreamUnderlyingSource<R> {
  return (source as WrappedReadableStreamUnderlyingSource<R>)[isWrappedReadableStream] === true;
}

export function createWrappingReadableStream(baseClass: ReadableStreamConstructor): ReadableStreamConstructor {
  const wrappingClass = class WrappingReadableStream<R = any> extends baseClass {

    constructor(underlyingSource: ReadableStreamUnderlyingSource<R> = {},
                strategy: Partial<QueuingStrategy> = {}) {
      if (!isWrappedReadableStreamUnderlyingSource(underlyingSource)) {
        const wrappedReadableStream = new baseClass<R>(underlyingSource);
        underlyingSource = createWrappingReadableSource(wrappedReadableStream, { type: underlyingSource.type });
      }

      super(underlyingSource, strategy);
    }

    get locked() {
      return super.locked;
    }

    cancel(reason: any) {
      return super.cancel(reason);
    }

    getReader(options: { mode: (R extends Uint8Array ? 'byob' : never) }): ReadableStreamBYOBReader;
    getReader(options?: { mode?: undefined }): ReadableStreamDefaultReader<R>;
    getReader(options: { mode?: 'byob' | undefined } = {}): ReadableStreamDefaultReader<R> | ReadableStreamBYOBReader {
      return super.getReader(options as any);
    }

    pipeThrough<T = any>(pair: ReadableWritableStreamPair<T, R>, options?: ReadableStreamPipeOptions): ReadableStream<T> {
      return super.pipeThrough(pair, options);
    }

    pipeTo(dest: WritableStream<R>, options: ReadableStreamPipeOptions = {}) {
      return super.pipeTo(dest, options);
    }

    tee(): [WrappingReadableStream<R>, WrappingReadableStream<R>] {
      const [branch1, branch2] = super.tee();

      const source1 = createWrappingReadableSource<R>(branch1) as WrappedReadableStreamUnderlyingSource<R>;
      const source2 = createWrappingReadableSource<R>(branch2) as WrappedReadableStreamUnderlyingSource<R>;
      source1[isWrappedReadableStream] = true;
      source2[isWrappedReadableStream] = true;
      const wrapped1 = new WrappingReadableStream<R>(source1);
      const wrapped2 = new WrappingReadableStream<R>(source2);
      return [wrapped1, wrapped2];
    }
  };

  Object.defineProperty(wrappingClass, 'name', { value: 'ReadableStream' });

  return wrappingClass as ReadableStreamConstructor;
}
