export function typeIsObject(x: any): x is object | Function {
  return (typeof x === 'object' && x !== null) || typeof x === 'function';
}
