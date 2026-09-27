// SPDX-License-Identifier: MIT
/* global __dirname */
'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const guard = spawnSync(process.execPath, [path.join(__dirname, 'patch-sdk-parsers.cjs'), '--check'], { cwd: root, encoding: 'utf8' });
assert.equal(guard.status, 0, guard.stderr || guard.stdout);

async function main() {
  // Exercise the actual CommonJS caller used by Expo Router, not the decoder in isolation.
  const query = require('query-string');
  assert.deepEqual({ ...query.parse('invite=abc-_123&name=Riya+Shah&empty=&flag') }, { empty: '', flag: null, invite: 'abc-_123', name: 'Riya Shah' });
  const unicode = { name: 'ਰਿਆ ਸ਼ਾਹ', city: 'चंडीगढ़', punctuation: 'a+b / c&d', emoji: '💙' };
  assert.deepEqual({ ...query.parse(query.stringify(unicode, { sort: false })) }, unicode);
  assert.deepEqual({ ...query.parse('mode=Online&mode=In%20person') }, { mode: ['Online', 'In person'] });

  // A subprocess deadline makes a future regression fail instead of hanging CI's event loop.
  const malformed = spawnSync(process.execPath, ['-e', `
    const assert = require('node:assert/strict');
    const query = require(${JSON.stringify(require.resolve('query-string'))});
    for (const value of ['%', '%ZZ', '%E0%A4%A', '%C2'.repeat(4096) + '%41']) {
      const result = query.parse('value=' + value);
      assert.equal(typeof result.value, 'string');
    }
    assert.equal(query.parse('value=%ZZ%41').value, '%ZZA');
  `], { cwd: root, encoding: 'utf8', timeout: 5000 });
  assert.equal(malformed.status, 0, malformed.error?.message || malformed.stderr || 'Malformed URI parsing exceeded its deadline.');

  // Metro uses both a byte buffer and a pathname. Test its real exported caller for each.
  const pngPath = path.join(root, 'assets/icon.png');
  const png = fs.readFileSync(pngPath);
  const dimensions = { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
  for (const assets of [require('metro/private/Assets'), require('@expo/metro/metro/Assets')]) {
    assert.deepEqual(assets.getAssetSize('png', png, pngPath), dimensions);
    const asset = await assets.getAssetData(pngPath, 'assets', [], null, '/assets');
    assert.equal(asset.width, dimensions.width);
    assert.equal(asset.height, dimensions.height);
    assert(asset.files.includes(pngPath));
  }

  // Xcode retains its existing no-options v4() call and 24-character project identifier.
  const project = require('xcode').project(path.join(root, 'unused-parser-check.pbxproj'));
  project.hash = { project: { objects: {} } };
  const ids = new Set(Array.from({ length: 50 }, () => project.generateUuid()));
  assert.equal(ids.size, 50);
  for (const id of ids) assert.match(id, /^[A-F0-9]{24}$/);
  console.info('SDK parser checks passed: ordinary/Unicode/malformed queries, Metro PNG buffers and paths, Xcode identifiers.');
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
