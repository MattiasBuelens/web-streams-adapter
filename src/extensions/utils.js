export function getBYOBOrDefaultReader(readable) {
  try {
    const reader = readable.getReader({ mode: 'byob' });
    return { reader, mode: 'byob' };
  } catch (e) {
    const reader = readable.getReader();
    return { reader, mode: 'default' };
  }
}
