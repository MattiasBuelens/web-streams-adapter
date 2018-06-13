import assert from './assert';
import { isReadableStream, isReadableStreamConstructor, supportsByobReader, supportsByteSource } from './checks';
import { noop } from './utils';
import {
  ReadableByteStreamController,
  ReadableByteStreamSource,
  ReadableStreamBYOBReader,
  ReadableStreamBYOBRequest,
  ReadableStreamDefaultController,
  ReadableStreamDefaultReader,
  ReadableStreamSource
} from 'whatwg-streams';
import { ReadableByteStreamLike, ReadableStreamLike, ReadableStreamLikeConstructor } from './stream-like';
import { ReadableStreamWrapper, WrappingReadableSourceOptions } from './wrappers';

export function createReadableStreamWrapper(ctor: ReadableStreamLikeConstructor): ReadableStreamWrapper {
  assert(isReadableStreamConstructor(ctor));

  const byteSourceSupported = supportsByteSource(ctor);

  return <R>(readable: ReadableStreamLike<R>, { type }: WrappingReadableSourceOptions = {}) => {
    type = parseReadableType(type);
    if (type === 'bytes' && !byteSourceSupported) {
      type = undefined;
    }
    if (readable.constructor === ctor) {
      if (type !== 'bytes' || supportsByobReader(readable)) {
        return readable;
      }
    }
    const source = createWrappingReadableSource(readable, { type });
    return new ctor(source);
  };
}

export function createWrappingReadableSource<R = any>(
  readable: ReadableStreamLike<R>,
  { type }: WrappingReadableSourceOptions = {}): ReadableStreamSource<R> | ReadableByteStreamSource<R> {
  assert(isReadableStream(readable));
  assert(readable.locked === false);

  type = parseReadableType(type);
  let source: ReadableStreamSource<R> | ReadableByteStreamSource<R>;
  if (type === 'bytes') {
    source = new WrappingReadableByteStreamSource(readable as any as ReadableByteStreamLike) as any;
  } else {
    source = new WrappingReadableStreamDefaultSource<R>(readable);
  }

  return source;
}

function parseReadableType(type: string | undefined): 'bytes' | undefined {
  const typeString = String(type);
  if (typeString === 'bytes') {
    return typeString;
  } else if (type === undefined) {
    return type;
  } else {
    throw new RangeError('Invalid type is specified');
  }
}

const enum ReadableStreamReaderMode {
  DEFAULT = 'default',
  BYOB = 'byob'
}

type ReadableStreamControllerBase<R> = ReadableStreamDefaultController<R> | ReadableByteStreamController<R>;
type ReadableStreamReaderBase<R> = ReadableStreamDefaultReader<R> | ReadableStreamBYOBReader<R>;

class AbstractWrappingReadableStreamSource<R> implements ReadableStreamSource<R> {

  protected readonly _underlyingStream: ReadableStreamLike<R>;
  protected _underlyingReader: ReadableStreamReaderBase<R> | undefined = undefined;
  protected _readerMode: ReadableStreamReaderMode | undefined = undefined;
  protected _readableStreamController: ReadableStreamControllerBase<R> = undefined!;
  private _pendingRead: Promise<void> | undefined = undefined;

  constructor(underlyingStream: ReadableStreamLike<R>) {
    this._underlyingStream = underlyingStream;

    // always keep a reader attached to detect close/error
    this._attachDefaultReader();
  }

  start(controller: ReadableStreamControllerBase<R>): void {
    this._readableStreamController = controller;
  }

  cancel(reason: any): Promise<void> {
    assert(this._underlyingReader !== undefined);

    return this._underlyingReader!.cancel(reason);
  }

  protected _attachDefaultReader(): void {
    if (this._readerMode === ReadableStreamReaderMode.DEFAULT) {
      return;
    }

    this._detachReader();

    const reader = this._underlyingStream.getReader();
    this._readerMode = ReadableStreamReaderMode.DEFAULT;
    this._attachReader(reader);
  }

  protected _attachReader(reader: ReadableStreamReaderBase<R>): void {
    assert(this._underlyingReader === undefined);

    this._underlyingReader = reader;

    const closed = this._underlyingReader.closed;
    if (!closed) {
      return;
    }
    closed
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
      .catch(noop);
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
    const read = (this._underlyingReader! as ReadableStreamDefaultReader<R>).read()
      .then(({ value, done }) => {
        const controller = this._readableStreamController;
        if (done) {
          this._tryClose();
        } else {
          controller.enqueue(value);
        }
      });

    this._setPendingRead(read);
    return read;
  }

  protected _tryClose(): void {
    try {
      this._readableStreamController.close();
    } catch {
      // already errored or closed
    }
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

class WrappingReadableByteStreamSource extends AbstractWrappingReadableStreamSource<ArrayBufferView>
  implements ReadableByteStreamSource {

  protected _readableStreamController!: ReadableByteStreamController;
  protected readonly _supportsByob: boolean;

  constructor(underlyingStream: ReadableByteStreamLike) {
    const supportsByob = supportsByobReader(underlyingStream);
    super(underlyingStream);
    this._supportsByob = supportsByob;
  }

  get type(): 'bytes' {
    return 'bytes';
  }

  _attachByobReader() {
    if (this._readerMode === ReadableStreamReaderMode.BYOB) {
      return;
    }

    assert(this._supportsByob);
    this._detachReader();

    const reader = this._underlyingStream.getReader({ mode: 'byob' });
    this._readerMode = ReadableStreamReaderMode.BYOB;
    this._attachReader(reader);
  }

  pull(): Promise<void> {
    if (this._supportsByob) {
      const byobRequest = this._readableStreamController.byobRequest;
      if (byobRequest !== undefined) {
        return this._pullWithByobRequest(byobRequest);
      }
    }

    return this._pullWithDefaultReader();
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
          this._tryClose();
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
