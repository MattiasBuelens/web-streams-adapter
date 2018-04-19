export function createWrappingWritableSink(writable) {
  const writer = writable.getWriter();
  return new WrappingWritableStreamSink(writer);
}

class WrappingWritableStreamSink {

  constructor(underlyingWriter) {
    this._underlyingWriter = underlyingWriter;
    this._writableStreamController = undefined;
    this._pendingWrite = undefined;
    this._state = 'writable';
    this._storedError = undefined;
    this._errorPromise = new Promise((resolve, reject) => {
      this._errorPromiseReject = reject;
    });
    this._errorPromise.catch(() => {});
  }

  start(controller) {
    this._writableStreamController = controller;

    this._underlyingWriter.closed
      .then(() => {
        this._state = 'closed';
      })
      .catch(reason => this._finishErroring(reason));
  }

  write(chunk) {
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

  close() {
    if (this._pendingWrite === undefined) {
      return this._underlyingWriter.close();
    }
    return this._finishPendingWrite().then(() => this.close());
  }

  abort(reason) {
    if (this._state === 'errored') {
      return undefined;
    }

    const writer = this._underlyingWriter;
    return writer.abort(reason);
  }

  _setPendingWrite(writePromise) {
    let pendingWrite;
    const finishWrite = () => {
      if (this._pendingWrite === pendingWrite) {
        this._pendingWrite = undefined;
      }
    };
    this._pendingWrite = pendingWrite = writePromise.then(finishWrite, finishWrite);
  }

  _finishPendingWrite() {
    if (this._pendingWrite === undefined) {
      return Promise.resolve();
    }
    const afterWrite = () => this._finishPendingWrite();
    return this._pendingWrite.then(afterWrite, afterWrite);
  }

  _startErroring(reason) {
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

  _finishErroring(reason) {
    if (this._state === 'writable') {
      this._startErroring(reason);
    }
    if (this._state === 'erroring') {
      this._state = 'errored';
      this._errorPromiseReject(this._storedError);
    }
  }

}
