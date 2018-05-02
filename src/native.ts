import { isReadableStreamConstructor, isTransformStreamConstructor, isWritableStreamConstructor } from './checks';

declare global {
  const ReadableStream: any;
  const WritableStream: any;
  const TransformStream: any;
}

export const NativeReadableStream = typeof ReadableStream === 'function' ? ReadableStream : undefined;
export const NativeWritableStream = typeof WritableStream === 'function' ? WritableStream : undefined;
export const NativeTransformStream = typeof TransformStream === 'function' ? TransformStream : undefined;

export const hasNativeReadableStreamConstructor = isReadableStreamConstructor(NativeReadableStream);
export const hasNativeWritableStreamConstructor = isWritableStreamConstructor(NativeWritableStream);
export const hasNativeTransformStreamConstructor = isTransformStreamConstructor(NativeTransformStream);
