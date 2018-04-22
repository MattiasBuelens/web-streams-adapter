import {
  QueuingStrategy,
  WritableStream,
  WritableStreamDefaultWriter,
  WritableStreamUnderlyingSink
} from '@mattiasbuelens/web-streams-polyfill';
import { createWrappingWritableSink } from '../';

export class WrappingWritableStream<W = any> extends WritableStream<W> {

  constructor(underlyingSink: WritableStreamUnderlyingSink<W> = {}, { size, highWaterMark }: Partial<QueuingStrategy> = {}) {
    const wrappedWritableStream = new WritableStream<W>(underlyingSink, { highWaterMark: 1 });
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

}

Object.defineProperty(WrappingWritableStream, 'name', { value: 'WritableStream' });
