import { typeIsObject } from './utils';
import {
  ReadableByteStreamLike,
  ReadableStreamLike,
  ReadableStreamLikeConstructor,
  TransformStreamLike,
  TransformStreamLikeConstructor,
  WritableStreamLike,
  WritableStreamLikeConstructor
} from '../';

type Constructor<T> = new(...args: any[]) => T;

function isStreamConstructor(ctor: any): ctor is Constructor<any> {
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

export function isReadableStream(readable: any): readable is ReadableStreamLike {
  if (!typeIsObject(readable)) {
    return false;
  }
  if (typeof (readable as ReadableStreamLike).getReader !== 'function') {
    return false;
  }
  return true;
}

export function isReadableStreamConstructor(ctor: any): ctor is ReadableStreamLikeConstructor {
  if (!isStreamConstructor(ctor)) {
    return false;
  }
  if (!isReadableStream(new ctor())) {
    return false;
  }
  return true;
}

export function isWritableStream(writable: any): writable is WritableStreamLike {
  if (!typeIsObject(writable)) {
    return false;
  }
  if (typeof (writable as WritableStreamLike).getWriter !== 'function') {
    return false;
  }
  return true;
}

export function isWritableStreamConstructor(ctor: any): ctor is WritableStreamLikeConstructor {
  if (!isStreamConstructor(ctor)) {
    return false;
  }
  if (!isWritableStream(new ctor())) {
    return false;
  }
  return true;
}

export function isTransformStream(transform: any): transform is TransformStreamLike {
  if (!typeIsObject(transform)) {
    return false;
  }
  if (!isReadableStream((transform as TransformStreamLike).readable)) {
    return false;
  }
  if (!isWritableStream((transform as TransformStreamLike).writable)) {
    return false;
  }
  return true;
}

export function isTransformStreamConstructor(ctor: any): ctor is TransformStreamLikeConstructor {
  if (!isStreamConstructor(ctor)) {
    return false;
  }
  if (!isTransformStream(new ctor())) {
    return false;
  }
  return true;
}

export function supportsByobReader<R>(readable: ReadableStreamLike<R>): boolean {
  try {
    const reader = (readable as any as ReadableByteStreamLike).getReader({ mode: 'byob' });
    reader.releaseLock();
    return true;
  } catch {
    return false;
  }
}

export function supportsByteSource<R>(ctor: ReadableStreamLikeConstructor): boolean {
  try {
    new ctor({ type: 'bytes' });
    return true;
  } catch {
    return false;
  }
}
