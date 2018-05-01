import assert from './assert';
import { isTransformStream, isTransformStreamConstructor } from './checks';
import { TransformStreamLike, TransformStreamLikeConstructor } from './stream-like';
import {
  ReadableStreamDefaultReader,
  TransformStreamDefaultController,
  TransformStreamTransformer,
  WritableStreamDefaultWriter
} from '@mattiasbuelens/web-streams-polyfill';

export type TransformStreamWrapper = <I, O>(Transform: TransformStreamLike<I, O>) => TransformStreamLike<I, O>;

export function createTransformStreamWrapper(ctor: TransformStreamLikeConstructor): TransformStreamWrapper {
  assert(isTransformStreamConstructor(ctor));

  return <I, O>(transform: TransformStreamLike<I, O>) => {
    const transformer = createWrappingTransformer(transform);
    return new ctor(transformer);
  };
}

export function createWrappingTransformer<I = any, O = any>(transform: TransformStreamLike<I, O>): TransformStreamTransformer<I, O> {
  assert(isTransformStream(transform));

  const { readable, writable } = transform;
  assert(readable.locked === false);
  assert(writable.locked === false);

  let reader: ReadableStreamDefaultReader<O> = readable.getReader();
  let writer: WritableStreamDefaultWriter<I>;
  try {
    writer = writable.getWriter();
  } catch (e) {
    reader.releaseLock(); // do not leak reader
    throw e;
  }

  return new WrappingTransformStreamTransformer<I, O>(reader, writer);
}

class WrappingTransformStreamTransformer<I, O> implements TransformStreamTransformer<I, O> {

  private readonly _reader: ReadableStreamDefaultReader<O>;
  private readonly _writer: WritableStreamDefaultWriter<I>;
  private readonly _flushPromise: Promise<void>;
  private _flushResolve!: () => void;
  private _flushReject!: (reason: any) => void;
  private _transformStreamController: TransformStreamDefaultController<O> = undefined!;

  constructor(reader: ReadableStreamDefaultReader<O>, writer: WritableStreamDefaultWriter<I>) {
    this._reader = reader;
    this._writer = writer;
    this._flushPromise = new Promise<void>((resolve, reject) => {
      this._flushResolve = resolve;
      this._flushReject = resolve;
    });
  }

  start(controller: TransformStreamDefaultController<O>) {
    this._transformStreamController = controller;

    this._reader.read()
      .then(this._onRead)
      .then(
        () => this._flushResolve(),
        this._onError
      );

    this._reader.closed
      .then(
        () => this._transformStreamController.terminate(),
        this._onError
      );
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
  };

}
