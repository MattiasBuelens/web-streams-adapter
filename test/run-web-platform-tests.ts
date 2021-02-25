/// <reference types="node" />
/// <reference path="./vendor/wpt-runner.d.ts" />

import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import wptRunner from 'wpt-runner';
import micromatch from 'micromatch';
import resolve from 'resolve';
import { createWrappingStreams } from './wrappers';

const readFileAsync = promisify(fs.readFile);

const testsPath = path.resolve(__dirname, '../web-platform-tests/streams');

const includedTests = process.argv.length >= 3 ? process.argv.slice(2) : ['**/*.html'];
const excludedTests = [
  // We cannot polyfill TransferArrayBuffer yet, so disable tests for detached array buffers
  // See https://github.com/MattiasBuelens/web-streams-polyfill/issues/3
  'readable-byte-streams/detached-buffers.any.html'
];
const includeMatcher = micromatch.matcher(includedTests as any);
const excludeMatcher = micromatch.matcher(excludedTests as any);
const workerTestPattern = /\.(?:dedicated|shared|service)worker(?:\.https)?\.html$/;

// HACK: Hide verbose logs
console.debug = () => {};

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

(async () => {
  try {
    const streamsJS = await readFileAsync(resolve.sync('web-streams-polyfill/es2018'), { encoding: 'utf8' });

    const failures: number = await wptRunner(testsPath, {
      rootURL: 'streams/',
      setup(window: any) {
        window.eval(streamsJS);
        const polyfill = window.WebStreamsPolyfill as typeof import('web-streams-polyfill');
        const wrappers = createWrappingStreams(polyfill as any);
        window.ReadableStream = wrappers.ReadableStream;
        window.WritableStream = wrappers.WritableStream;
        window.TransformStream = wrappers.TransformStream;
        window.ByteLengthQueuingStrategy = polyfill.ByteLengthQueuingStrategy;
        window.CountQueuingStrategy = polyfill.CountQueuingStrategy;
      },
      filter(testPath: string): boolean {
        return !workerTestPattern.test(testPath) && // ignore the worker versions
          includeMatcher(testPath) &&
          !excludeMatcher(testPath);
      }
    });
    process.exitCode = failures;

    if (rejections.size > 0) {
      if (failures === 0) {
        process.exitCode = 1;
      }

      for (const reason of rejections.values()) {
        console.error('Unhandled promise rejection: ', reason.stack);
      }
    }
  } catch (e) {
    console.error(e.stack);
    process.exitCode = 1;
  }
})();
