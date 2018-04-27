import assert from './assert';
import { isReadableStream } from './checks';
import { supportsByobReader } from './utils';
import {
  ReadableByteStreamController,
  ReadableByteStreamStreamUnderlyingSource,
  ReadableStream,
  ReadableStreamBYOBReader,
  ReadableStreamBYOBRequest,
  ReadableStreamControllerBase,
  ReadableStreamDefaultController,
  ReadableStreamDefaultReader,
  ReadableStreamDefaultUnderlyingSource,
  ReadableStreamReaderBase,
  ReadableStreamUnderlyingSource
} from '@mattiasbuelens/web-streams-polyfill';

export type ReadableByteStream = ReadableStream<Uint8Array>;

export function createWrappingReadableSource<R = any>(readable: ReadableStream<R>): ReadableStreamUnderlyingSource<R> {
  assert(isReadableStream(readable));
  assert(readable.locked === false);

  let source: ReadableStreamUnderlyingSource<R>;
  if (supportsByobReader(readable)) {
    source = new WrappingReadableByteStreamSource(readable as any as ReadableByteStream) as any;
  } else {
    source = new WrappingReadableStreamDefaultSource<R>(readable);
  }

  return source;
}

type ReadableStreamReaderMode = 'default' | 'byob';

class AbstractWrappingReadableStreamSource<R> implements ReadableStreamDefaultUnderlyingSource {

  protected readonly _underlyingStream: ReadableStream<R>;
  protected _underlyingReader: ReadableStreamReaderBase | undefined = undefined;
  protected _readerMode: ReadableStreamReaderMode | undefined = undefined;
  protected _readableStreamController: ReadableStreamControllerBase<R> = undefined!;
  private _pendingRead: Promise<void> | undefined = undefined;

  constructor(underlyingStream: ReadableStream<R>) {
    this._underlyingStream = underlyingStream;

    // always keep a reader attached to detect close/error
    this._attachDefaultReader();
  }

  start(controller: ReadableStreamControllerBase<R>): void {
    this._readableStreamController = controller;
  }

  cancel(reason: any): Promise<void> {
    if (this._underlyingReader !== undefined) {
      return this._underlyingReader.cancel(reason);
    } else {
      return this._underlyingStream.cancel(reason);
    }
  }

  protected _attachDefaultReader(): void {
    if (this._readerMode === 'default') {
      return;
    }

    this._detachReader();

    const reader = this._underlyingStream.getReader();
    this._readerMode = 'default';
    this._attachReader(reader);
  }

  protected _attachReader(reader: ReadableStreamReaderBase): void {
    assert(this._underlyingReader === undefined);

    this._underlyingReader = reader;
    this._underlyingReader.closed
      .then(() => this._finishPendingRead())
      .then(() => {
        if (reader === this._underlyingReader) {
          this._readableStreamController.close();
        }
      }, reason => {
        if (reader === this._underlyingReader) {
          this._readableStreamController.error(reason);
        }
      })
      .catch(() => {});
  }

  protected _detachReader(): void {
    if (this._underlyingReader === undefined) {
      return;
    }

    this._underlyingReader.releaseLock();
    this._underlyingReader = undefined;
    this._readerMode = undefined;
  }

  protected _pullWithDefaultReader(): Promise<void> {
    this._attachDefaultReader();

    // TODO Backpressure?
    const read = (this._underlyingReader! as ReadableStreamDefaultReader).read()
      .then(({ value, done }) => {
        const controller = this._readableStreamController;
        if (done) {
          controller.close();
        } else {
          controller.enqueue(value);
        }
      });

    this._setPendingRead(read);
    return read;
  }

  protected _setPendingRead(readPromise: Promise<void>) {
    let pendingRead: Promise<void>;
    const finishRead = () => {
      if (this._pendingRead === pendingRead) {
        this._pendingRead = undefined;
      }
    };
    this._pendingRead = pendingRead = readPromise.then(finishRead, finishRead);
  }

  private _finishPendingRead(): Promise<void> | undefined {
    if (!this._pendingRead) {
      return undefined;
    }
    const afterRead = () => this._finishPendingRead();
    return this._pendingRead.then(afterRead, afterRead);
  }

}

class WrappingReadableStreamDefaultSource<R> extends AbstractWrappingReadableStreamSource<R> {

  protected _readableStreamController!: ReadableStreamDefaultController<R>;

  pull(): Promise<void> {
    return this._pullWithDefaultReader();
  }

}

function toUint8Array(view: ArrayBufferView): Uint8Array {
  return new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
}

function copyArrayBufferView(from: ArrayBufferView, to: ArrayBufferView) {
  const fromArray = toUint8Array(from);
  const toArray = toUint8Array(to);
  toArray.set(fromArray, 0);
}

class WrappingReadableByteStreamSource extends AbstractWrappingReadableStreamSource<Uint8Array> implements ReadableByteStreamStreamUnderlyingSource {

  protected _readableStreamController!: ReadableByteStreamController;

  constructor(underlyingStream: ReadableByteStream) {
    super(underlyingStream);
  }

  get type(): 'bytes' {
    return 'bytes';
  }

  _attachByobReader() {
    if (this._readerMode === 'byob') {
      return;
    }

    this._detachReader();

    const reader = this._underlyingStream.getReader({ mode: 'byob' });
    this._readerMode = 'byob';
    this._attachReader(reader);
  }

  pull(): Promise<void> {
    const byobRequest = this._readableStreamController.byobRequest;
    if (byobRequest !== undefined) {
      return this._pullWithByobRequest(byobRequest);
    } else {
      return this._pullWithDefaultReader();
    }
  }

  _pullWithByobRequest(byobRequest: ReadableStreamBYOBRequest): Promise<void> {
    this._attachByobReader();

    // reader.read(view) detaches the input view, therefore we cannot pass byobRequest.view directly
    // create a separate buffer to read into, then copy that to byobRequest.view
    const buffer = new Uint8Array(byobRequest.view.byteLength);

    // TODO Backpressure?
    const read = (this._underlyingReader! as ReadableStreamBYOBReader).read(buffer)
      .then(({ value, done }) => {
        const controller = this._readableStreamController;
        if (done) {
          controller.close();
          byobRequest.respond(0);
        } else {
          copyArrayBufferView(value, byobRequest.view);
          byobRequest.respond(value.byteLength);
        }
      });

    this._setPendingRead(read);
    return read;
  }

}
