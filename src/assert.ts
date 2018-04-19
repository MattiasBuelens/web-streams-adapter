export class AssertionError extends Error {
}

export default function assert(test: boolean): void | never {
  if (!test) {
    throw new AssertionError();
  }
}
