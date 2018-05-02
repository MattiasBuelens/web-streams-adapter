import { ReadableByteStreamLike, ReadableStreamLike, ReadableStreamLikeConstructor } from '../';

export function noop() {
  return;
}

export function typeIsObject(x: any): x is object | Function {
  return (typeof x === 'object' && x !== null) || typeof x === 'function';
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
