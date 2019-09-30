// @flow

/* eslint-disable no-console */

import assert from 'assert';
import invariant from 'assert';
import path from 'path';
import {bundle} from '@parcel/test-utils';
import defaultConfigContents from '@parcel/config-default';
// import semver from 'semver';
import sinon from 'sinon';

const jsonConfig = {
  ...defaultConfigContents,
  reporters: ['@parcel/reporter-json'],
  filePath: require.resolve('@parcel/config-default')
};

describe('json reporter', () => {
  let stub;
  beforeEach(() => {
    stub = sinon.stub(console, 'log');
  });

  afterEach(() => {
    stub.restore();
  });

  it('logs bundling a commonjs bundle to stdout as json', async () => {
    // For some reason on CI, outside of Linux or Node 12, this asynchronous
    // function resolves before it completes.
    // if (
    //   process.platform !== 'linux' &&
    //   !semver.satisfies(process.version, '>=12')
    // ) {
    //   return;
    // }

    await bundle(path.join(__dirname, '/integration/commonjs/index.js'), {
      defaultConfig: jsonConfig,
      logLevel: 'info'
    });

    let parsedCalls = stub.getCalls().map(call => JSON.parse(call.lastArg));
    for (let [iStr, parsed] of Object.entries(parsedCalls)) {
      parsed = (parsed: any);
      invariant(typeof iStr === 'string');
      let i = parseInt(iStr, 10);

      if (i === 0) {
        assert.deepEqual(parsed, {type: 'buildStart'});
      } else if (i > 0 && i < 9) {
        assert.equal(parsed.type, 'buildProgress');
        assert.equal(parsed.phase, 'transforming');
        assert(typeof parsed.filePath === 'string');
      } else if (i === 9) {
        assert.deepEqual(parsed, {
          type: 'buildProgress',
          phase: 'bundling'
        });
      } else if (i === 10) {
        assert.equal(parsed.type, 'buildProgress');
        assert.equal(parsed.phase, 'packaging');
        assert(parsed.bundleFilePath.endsWith('dist' + path.sep + 'index.js'));
      } else if (i === 11) {
        assert.equal(parsed.type, 'buildProgress');
        assert.equal(parsed.phase, 'optimizing');
        assert(parsed.bundleFilePath.endsWith('dist' + path.sep + 'index.js'));
      } else if (i === 12) {
        assert.equal(parsed.type, 'buildSuccess');
        assert(typeof parsed.buildTime === 'number');
        assert(Array.isArray(parsed.bundles));
        let bundle = parsed.bundles[0];
        assert(bundle.filePath.endsWith('dist' + path.sep + 'index.js'));
        assert(typeof bundle.size === 'number');
        assert(typeof bundle.time === 'number');
        assert(Array.isArray(bundle.largestAssets));
      }
    }
  });
});
