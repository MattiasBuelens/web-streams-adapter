import assert from './assert';
import { isTransformStream, isTransformStreamConstructor } from './checks';
import {
  ReadableStreamLikeDefaultReader,
  TransformStreamLike,
  TransformStreamLikeConstructor,
  WritableStreamLikeDefaultWriter
} from './stream-like';
import { TransformStreamWrapper } from './wrappers';
import { TransformStreamDefaultController, TransformStreamTransformer } from '@mattiasbuelens/web-streams-polyfill';
import { noop } from './utils';

export function createTransformStreamWrapper(ctor: TransformStreamLikeConstructor): TransformStreamWrapper {
  assert(isTransformStreamConstructor(ctor));

  return <I, O>(transform: TransformStreamLike<I, O>) => {
    if (transform.constructor === ctor) {
      return transform;
    }
    const transformer = createWrappingTransformer(transform);
    return new ctor(transformer);
  };
}

export function createWrappingTransformer<I = any, O = any>(transform: TransformStreamLike<I, O>): TransformStreamTransformer<I, O> {
  assert(isTransformStream(transform));

  const { readable, writable } = transform;
  assert(readable.locked === false);
  assert(writable.locked === false);

  let reader: ReadableStreamLikeDefaultReader<O> = readable.getReader();
  let writer: WritableStreamLikeDefaultWriter<I>;
  try {
    writer = writable.getWriter();
  } catch (e) {
    reader.releaseLock(); // do not leak reader
    throw e;
  }

  return new WrappingTransformStreamTransformer<I, O>(reader, writer);
}

class WrappingTransformStreamTransformer<I, O> implements TransformStreamTransformer<I, O> {

  private readonly _reader: ReadableStreamLikeDefaultReader<O>;
  private readonly _writer: WritableStreamLikeDefaultWriter<I>;
  private readonly _flushPromise: Promise<void>;
  private _flushResolve!: () => void;
  private _flushReject!: (reason: any) => void;
  private _transformStreamController: TransformStreamDefaultController<O> = undefined!;

  constructor(reader: ReadableStreamLikeDefaultReader<O>, writer: WritableStreamLikeDefaultWriter<I>) {
    this._reader = reader;
    this._writer = writer;
    this._flushPromise = new Promise<void>((resolve, reject) => {
      this._flushResolve = resolve;
      this._flushReject = reject;
    });
  }

  start(controller: TransformStreamDefaultController<O>) {
    this._transformStreamController = controller;

    this._reader.read()
      .then(this._onRead)
      .then(this._onTerminate, this._onError);

    this._reader.closed
      .then(this._onTerminate, this._onError);
  }

  transform(chunk: I) {
    return this._writer.write(chunk);
  }

  flush() {
    return this._writer.close()
      .then(() => this._flushPromise);
  }

  private _onRead = ({ done, value }: IteratorResult<O>): void | Promise<void> => {
    if (done) {
      return;
    }
    this._transformStreamController.enqueue(value);
    return this._reader.read().then(this._onRead);
  };

  private _onError = (reason: any) => {
    this._flushReject(reason);
    this._transformStreamController.error(reason);

    this._reader.cancel(reason).catch(noop);
    this._writer.abort(reason).catch(noop);
  };

  private _onTerminate = () => {
    this._flushResolve();
    this._transformStreamController.terminate();

    const error = new TypeError('TransformStream terminated');
    this._writer.abort(error).catch(noop);
  };

}
