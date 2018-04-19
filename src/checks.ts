import { typeIsObject } from './helpers';
import {
  ReadableStream,
  ReadableStreamConstructor,
  TransformStream,
  TransformStreamConstructor,
  WritableStream,
  WritableStreamConstructor
} from '@mattiasbuelens/web-streams-polyfill';

function isStreamConstructor(ctor: any): ctor is Function {
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

export function isReadableStream(readable: any): readable is ReadableStream {
  if (!typeIsObject(readable)) {
    return false;
  }
  if (typeof (readable as ReadableStream).getReader !== 'function') {
    return false;
  }
  return true;
}

export function isReadableStreamConstructor(ctor: any): ctor is ReadableStreamConstructor {
  if (!isStreamConstructor(ctor)) {
    return false;
  }
  if (!isReadableStream(new ctor())) {
    return false;
  }
  return true;
}

export function isWritableStream(writable: any): writable is WritableStream {
  if (!typeIsObject(writable)) {
    return false;
  }
  if (typeof (writable as WritableStream).getWriter !== 'function') {
    return false;
  }
  return true;
}

export function isWritableStreamConstructor(ctor: any): ctor is WritableStreamConstructor {
  if (!isStreamConstructor(ctor)) {
    return false;
  }
  if (!isWritableStream(new ctor())) {
    return false;
  }
  return true;
}

export function isTransformStream(transform: any): transform is TransformStream {
  if (!typeIsObject(transform)) {
    return false;
  }
  if (!isReadableStream((transform as TransformStream).readable)) {
    return false;
  }
  if (!isWritableStream((transform as TransformStream).writable)) {
    return false;
  }
  return true;
}

export function isTransformStreamConstructor(ctor: any): ctor is TransformStreamConstructor {
  if (!isStreamConstructor(ctor)) {
    return false;
  }
  if (!isTransformStream(new ctor())) {
    return false;
  }
  return true;
}
