export default function assert(test: boolean): void | never {
  if (!test) {
    throw new TypeError('Assertion failed');
  }
}
