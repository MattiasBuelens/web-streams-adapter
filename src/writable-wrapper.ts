import {
  WritableStream,
  WritableStreamDefaultController,
  WritableStreamDefaultWriter,
  WritableStreamUnderlyingSink
} from '@mattiasbuelens/web-streams-polyfill';

export function createWrappingWritableSink<W = any>(writable: WritableStream<W>): WritableStreamUnderlyingSink<W> {
  const writer = writable.getWriter();
  return new WrappingWritableStreamSink(writer);
}

type WritableStreamState = 'writable' | 'erroring' | 'errored' | 'closed';

class WrappingWritableStreamSink<W> implements WritableStreamUnderlyingSink<W> {

  protected readonly _underlyingWriter: WritableStreamDefaultWriter<W>;
  private _writableStreamController: WritableStreamDefaultController = undefined!;
  private _pendingWrite: Promise<void> | undefined = undefined;
  private _state: WritableStreamState = 'writable';
  private _storedError: any = undefined;
  private _errorPromise: Promise<void>;
  private _errorPromiseReject!: (reason: any) => void;

  constructor(underlyingWriter: WritableStreamDefaultWriter<W>) {
    this._underlyingWriter = underlyingWriter;
    this._errorPromise = new Promise<void>((resolve, reject) => {
      this._errorPromiseReject = reject;
    });
    this._errorPromise.catch(() => {});
  }

  start(controller: WritableStreamDefaultController): void {
    this._writableStreamController = controller;

    this._underlyingWriter.closed
      .then(() => {
        this._state = 'closed';
      })
      .catch(reason => this._finishErroring(reason));
  }

  write(chunk: W): Promise<void> {
    const writer = this._underlyingWriter;

    // Detect past errors
    if (writer.desiredSize === null) {
      return writer.ready;
    }

    const writeRequest = writer.write(chunk);

    // Detect future errors
    writeRequest.catch(reason => this._finishErroring(reason));
    writer.ready.catch(reason => this._startErroring(reason));

    // Reject write when errored
    const write = Promise.race([writeRequest, this._errorPromise]);

    this._setPendingWrite(write);
    return write;
  }

  close(): Promise<void> {
    if (this._pendingWrite === undefined) {
      return this._underlyingWriter.close();
    }
    return this._finishPendingWrite().then(() => this.close());
  }

  abort(reason: any): void | Promise<void> {
    if (this._state === 'errored') {
      return undefined;
    }

    const writer = this._underlyingWriter;
    return writer.abort(reason);
  }

  private _setPendingWrite(writePromise: Promise<void>) {
    let pendingWrite: Promise<void>;
    const finishWrite = () => {
      if (this._pendingWrite === pendingWrite) {
        this._pendingWrite = undefined;
      }
    };
    this._pendingWrite = pendingWrite = writePromise.then(finishWrite, finishWrite);
  }

  private _finishPendingWrite(): Promise<void> {
    if (this._pendingWrite === undefined) {
      return Promise.resolve();
    }
    const afterWrite = () => this._finishPendingWrite();
    return this._pendingWrite.then(afterWrite, afterWrite);
  }

  private _startErroring(reason: any): void {
    if (this._state === 'writable') {
      this._state = 'erroring';
      this._storedError = reason;

      const afterWrite = () => this._finishErroring(reason);
      if (this._pendingWrite === undefined) {
        afterWrite();
      } else {
        this._finishPendingWrite().then(afterWrite, afterWrite);
      }

      this._writableStreamController.error(reason);
    }
  }

  private _finishErroring(reason: any): void {
    if (this._state === 'writable') {
      this._startErroring(reason);
    }
    if (this._state === 'erroring') {
      this._state = 'errored';
      this._errorPromiseReject(this._storedError);
    }
  }

}
