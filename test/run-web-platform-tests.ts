/// <reference types="node" />

const path = require('path');
const wptRunner = require('wpt-runner');
const minimatch = require('minimatch');
const { createWrappingReadableStream } = require('./wrapping-readable-stream');
const { createWrappingWritableStream } = require('./wrapping-writable-stream');
const { createWrappingTransformStream } = require('./wrapping-transform-stream');
const {
  ReadableStream,
  WritableStream,
  ByteLengthQueuingStrategy,
  CountQueuingStrategy,
  TransformStream
} = require('@mattiasbuelens/web-streams-polyfill/dist/polyfill.wpt');
const WrappingReadableStream = createWrappingReadableStream(ReadableStream);
const WrappingWritableStream = createWrappingWritableStream(WritableStream);
const WrappingTransformStream = createWrappingTransformStream(TransformStream);

const testsPath = path.resolve(__dirname, '../web-platform-tests/streams');

const filterGlobs = process.argv.length >= 3 ? process.argv.slice(2) : ['**/*.html'];
const workerTestPattern = /\.(?:dedicated|shared|service)worker(?:\.https)?\.html$/;

function filter(testPath: string): boolean {
  return !workerTestPattern.test(testPath) && // ignore the worker versions
    filterGlobs.some(glob => minimatch(testPath, glob));
}

// wpt-runner does not yet support unhandled rejection tracking a la
// https://github.com/w3c/testharness.js/commit/7716e2581a86dfd9405a9c00547a7504f0c7fe94
// So we emulate it with Node.js events
const rejections = new Map<Promise<any>, Error>();
process.on('unhandledRejection', (reason: Error, promise: Promise<any>) => {
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
  window.TransformStream = TransformStream;
  window.ByteLengthQueuingStrategy = ByteLengthQueuingStrategy;
  window.CountQueuingStrategy = CountQueuingStrategy;
}
