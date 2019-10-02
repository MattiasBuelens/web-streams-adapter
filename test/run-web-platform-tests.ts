/// <reference types="node" />

const path = require('path');
const wptRunner = require('wpt-runner');
const micromatch = require('micromatch');
const { createWrappingStreams } = require('./wrappers');
const WebStreamsPolyfill = require('web-streams-polyfill/ponyfill/es2018');
const {
  ReadableStream: WrappingReadableStream,
  WritableStream: WrappingWritableStream,
  TransformStream: WrappingTransformStream
} = createWrappingStreams(WebStreamsPolyfill);

const testsPath = path.resolve(__dirname, '../web-platform-tests/streams');

const includedTests = process.argv.length >= 3 ? process.argv.slice(2) : ['**/*.html'];
const excludedTests = [
  // We cannot polyfill TransferArrayBuffer yet, so disable tests for detached array buffers
  // See https://github.com/MattiasBuelens/web-streams-polyfill/issues/3
  'readable-byte-streams/detached-buffers.any.html'
];
const includeMatcher = micromatch.matcher(includedTests);
const excludeMatcher = micromatch.matcher(excludedTests);
const workerTestPattern = /\.(?:dedicated|shared|service)worker(?:\.https)?\.html$/;

// HACK: Hide verbose logs
console.debug = () => {};

function filter(testPath: string): boolean {
  return !workerTestPattern.test(testPath) && // ignore the worker versions
    includeMatcher(testPath) &&
    !excludeMatcher(testPath);
}

// wpt-runner does not yet support unhandled rejection tracking a la
// https://github.com/w3c/testharness.js/commit/7716e2581a86dfd9405a9c00547a7504f0c7fe94
// So we emulate it with Node.js events
const rejections = new Map<Promise<any>, Error>();
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  rejections.set(promise, reason);
});

process.on('rejectionHandled', (promise: Promise<any>) => {
  rejections.delete(promise);
});

wptRunner(testsPath, { rootURL: 'streams/', setup, filter })
  .then((failures: number) => {
    process.exitCode = failures;

    if (rejections.size > 0) {
      if (failures === 0) {
        process.exitCode = 1;
      }

      for (const reason of rejections.values()) {
        console.error('Unhandled promise rejection: ', reason.stack);
      }
    }
  })
  .catch((e: Error) => {
    console.error(e.stack);
    process.exitCode = 1;
  });

function setup(window: any) {
  // Necessary so that we can send test-realm promises to the jsdom-realm implementation without causing assimilation.
  window.Promise = Promise;

  window.ReadableStream = WrappingReadableStream;
  window.WritableStream = WrappingWritableStream;
  window.TransformStream = WrappingTransformStream;
  window.ByteLengthQueuingStrategy = WebStreamsPolyfill.ByteLengthQueuingStrategy;
  window.CountQueuingStrategy = WebStreamsPolyfill.CountQueuingStrategy;
}
