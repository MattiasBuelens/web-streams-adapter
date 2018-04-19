import { typeIsObject } from './helpers';

function isStreamConstructor(ctor) {
  if (typeof ctor !== 'function') {
    return false;
  }
  let startCalled = false;
  try {
    new ctor({
      start() {
        startCalled = true;
      }
    });
  } catch (e) {
    // ignore
  }
  return startCalled;
}

export function isReadableStream(readable) {
  if (!typeIsObject(readable)) {
    return false;
  }
  if (typeof readable.getReader !== 'function') {
    return false;
  }
  return true;
}

export function isReadableStreamConstructor(ctor) {
  if (!isStreamConstructor(ctor)) {
    return false;
  }
  if (!isReadableStream(new ctor())) {
    return false;
  }
  return true;
}

export function isWritableStream(writable) {
  if (!typeIsObject(writable)) {
    return false;
  }
  if (typeof writable.getWriter !== 'function') {
    return false;
  }
  return true;
}

export function isWritableStreamConstructor(ctor) {
  if (!isStreamConstructor(ctor)) {
    return false;
  }
  if (!isWritableStream(new ctor())) {
    return false;
  }
  return true;
}

export function isTransformStream(transform) {
  if (!typeIsObject(transform)) {
    return false;
  }
  if (!isReadableStream(transform.readable)) {
    return false;
  }
  if (!isWritableStream(transform.writable)) {
    return false;
  }
  return true;
}

export function isTransformStreamConstructor(ctor) {
  if (!isStreamConstructor(ctor)) {
    return false;
  }
  if (!isTransformStream(new ctor())) {
    return false;
  }
  return true;
}
