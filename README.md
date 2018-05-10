# web-streams-adapter
Adapters for converting between different implementations of [WHATWG Streams][spec].

## Why?
When you've got a `ReadableStream` from a native web API, you might be disappointed to find out
that not all browser support the latest and greatest features from the streams spec yet:
```js
const response = await fetch('http://example.com/data.txt');
const readable = response.body;
const writable = new WritableStream({ write(chunk) { console.log(chunk) } });
await readable.pipeTo(writable); // TypeError: Object doesn't support property or method 'pipeTo'
```

This is because although many browsers have already started implementing streams,
most of them are not yet fully up-to-date with the latest specification:
* Chrome 59 supports `ReadableStream` and `WritableStream`,
  and `TransformStream` [will arrive in Chrome 67][ts-chrome-status].
  Readable byte streams are [not yet supported][byte-stream-chrome-bug].
* Firefox 57 supports `ReadableStream`, but only behind an experimental flag.
* Edge 16 supports `ReadableStream`, but does not yet support developer-created streams using `new ReadableStream`.
  `WritableStream` however is fully supported.
* Safari supports `ReadableStream`, but no readable byte streams or writable streams.

For up-to-date information, check [caniuse.com][caniuse]
and the browser compatibility tables on MDN for [`ReadableStream`][rs-compat] and [`WritableStream`][ws-compat].

## What?
`web-streams-adapter` provides adapter functions that take any readable/writable/transform stream
and wraps it into a different readable/writable/stream with a different (more complete) implementation of your choice,
for example [`web-streams-polyfill`][creatorrr-polyfill].
```js
// setup
import { ReadableStream as PolyfillReadableStream } from 'web-streams-polyfill';
import { createReadableStreamWrapper } from '@mattiasbuelens/web-streams-adapter';
const toPolyfillReadable = createReadableStreamWrapper(PolyfillReadableStream);

// when handling a fetch response
const response = await fetch('http://example.com/data.txt');
const readable = toPolyfillReadable(response.body);
console.log(readable instanceof PolyfillReadableStream); // -> true
await readable.pipeTo(writable); // works!
```

You can also use an adapter to convert from your polyfilled stream back to a native stream:
```js
// setup
const toNativeReadable = createReadableStreamWrapper(self.ReadableStream);

// when starting a fetch with a streaming POST body
const readable = new PolyfillReadableStream({ /* amazingness */ });
const response = await fetch(url, {
  method: 'POST',
  body: toNativeReadable(readable) // works!
});
```

## How?
For readable streams, `web-streams-adapter` creates an underlying source that pulls from the given readable stream
using the primitive reader API. This source can then be used by *any* other readable stream implementation,
both native and polyfilled ones.

For writable and transform streams, it uses a very similar approach to create an underlying sink or transformer
using primitive reader and writer APIs on the given stream.

[spec]: https://streams.spec.whatwg.org/
[ts-chrome-status]: https://www.chromestatus.com/feature/5466425791610880
[byte-stream-chrome-bug]: https://bugs.chromium.org/p/chromium/issues/detail?id=614302
[caniuse]: https://www.caniuse.com/#feat=streams
[rs-compat]: https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream#Browser_Compatibility
[ws-compat]: https://developer.mozilla.org/en-US/docs/Web/API/WritableStream#Browser_Compatibility
[creatorrr-polyfill]: https://github.com/creatorrr/web-streams-polyfill
