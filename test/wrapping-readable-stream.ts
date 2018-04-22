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

export function createWrappingReadableStream(baseClass: ReadableStreamConstructor): ReadableStreamConstructor {
const wrappingClass = class WrappingReadableStream<R = any> extends baseClass {

  constructor(underlyingSource: ReadableStreamUnderlyingSource<R> = {}, { size, highWaterMark }: Partial<QueuingStrategy> = {}, wrapped = false) {
    if (!wrapped) {
      const wrappedReadableStream = new baseClass<R>(underlyingSource, { size, highWaterMark });
      underlyingSource = createWrappingReadableSource(wrappedReadableStream);
      size = undefined;
      highWaterMark = 0;
    }

    super(underlyingSource, { size, highWaterMark });
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

    const wrapped1 = new WrappingReadableStream<R>(createWrappingReadableSource<R>(branch1), {}, true);
    const wrapped2 = new WrappingReadableStream<R>(createWrappingReadableSource<R>(branch2), {}, true);
    return [wrapped1, wrapped2];
  }
};

Object.defineProperty(wrappingClass, 'name', { value: 'ReadableStream' });

return wrappingClass as ReadableStreamConstructor;
}
