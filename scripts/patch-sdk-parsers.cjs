// SPDX-License-Identifier: MIT
/* global __dirname */
// Compatibility at the callers only; the upstream parser algorithms remain unmodified.
// query-string 7.1.3 (MIT): https://github.com/sindresorhus/query-string/tree/v7.1.3
// Decoder fix/API: https://github.com/SamVerschueren/decode-uri-component/releases/tag/v0.5.0
// Metro 0.84.4 (MIT): https://github.com/facebook/metro/tree/v0.84.4/packages/metro
// Image parser fix/API: https://codeberg.org/image-size/image-size/src/tag/v2.0.4
// https://github.com/advisories/GHSA-5p2g-fcmc-qvqq
// https://github.com/advisories/GHSA-w3rx-r6r6-pgpr
// UUID keeps the CJS v4() API: https://github.com/uuidjs/uuid/releases/tag/v11.1.1
// Review versions, complete source hashes and call sites before updating these patches.
// This script intentionally fails installation for missing, changed or unreviewed packages.
'use strict';

const { createHash } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');

const root = path.resolve(__dirname, '..');
const checkOnly = process.argv.includes('--check');
const options = process.argv.slice(2);
if (options.some((option) => option !== '--check') || options.length > 1) {
  throw new Error('Usage: node scripts/patch-sdk-parsers.cjs [--check]');
}
const [nodeMajor, nodeMinor] = process.versions.node.split('.').map(Number);
if (nodeMajor < 22 || (nodeMajor === 22 && nodeMinor < 13)) {
  throw new Error('Circle parser compatibility requires Node.js 22.13 or newer.');
}

const lock = JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8'));
const targets = {
  'query-string': ['7.1.3'],
  'decode-uri-component': ['0.5.0'],
  // Expo's newer copy has its own image parser and needs no compatibility change.
  metro: ['0.84.4', '0.84.5'],
  'image-size': ['2.0.4'],
  xcode: ['3.0.1'],
  uuid: ['11.1.1'],
};
const installed = new Map();
for (const [name, versions] of Object.entries(targets)) {
  const suffix = `node_modules/${name}`;
  const entries = Object.entries(lock.packages).filter(([key]) => key === suffix || key.endsWith(`/${suffix}`));
  if (!entries.length) throw new Error(`Circle: required ${name} is missing from the lockfile.`);
  const copies = entries.map(([key, item]) => {
    const packagePath = path.join(root, key, 'package.json');
    const actual = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    if (!versions.includes(item.version) || actual.name !== name || actual.version !== item.version) {
      throw new Error(`Circle: ${name} changed; review its compatibility patch before updating dependencies.`);
    }
    return { directory: path.dirname(packagePath), require: createRequire(packagePath), version: actual.version, dependencies: actual.dependencies };
  });
  installed.set(name, copies);
}

// Resolve from each actual caller, not an assumed top-level node_modules location.
function assertResolvesTo(caller, dependency) {
  for (const copy of installed.get(caller)) {
    if (!copy.dependencies?.[dependency]) continue;
    const resolved = fs.realpathSync(copy.require.resolve(dependency));
    const known = installed.get(dependency).some(({ directory }) => {
      const relative = path.relative(fs.realpathSync(directory), resolved);
      return relative !== '' && !relative.startsWith('..') && !path.isAbsolute(relative);
    });
    if (!known) throw new Error(`Circle: ${caller} resolves an unreviewed copy of ${dependency}.`);
  }
}
assertResolvesTo('query-string', 'decode-uri-component');
assertResolvesTo('metro', 'image-size');
assertResolvesTo('xcode', 'uuid');

const patches = [
  {
    name: 'query-string',
    version: '7.1.3',
    file: 'index.js',
    beforeHash: 'caa3f2c8b45dfe1e91db22ae10743af68de8d96f26515132bb52485ec0f037fa',
    afterHash: '015fa100344e3786e350c0ac8359a3a4699d94f254bec4bca5b5a144bffdd6ec',
    before: "const decodeComponent = require('decode-uri-component');",
    after: [
      '// Circle compatibility: decode-uri-component 0.5 exports its decoder as ESM default.',
      "const decodeComponentModule = require('decode-uri-component');",
      "const decodeComponent = typeof decodeComponentModule === 'function'",
      '\t? decodeComponentModule',
      '\t: decodeComponentModule.default;',
      "if (typeof decodeComponent !== 'function') {",
      "\tthrow new TypeError('Circle: decode-uri-component must export a decoder function.');",
      '}',
    ].join('\n'),
  },
  {
    name: 'metro',
    version: '0.84.4',
    file: 'src/Assets.js',
    beforeHash: '5614658f2f2e892736637a084b0425d2317d4d975ca468cea48d9ff21b83b34d',
    afterHash: '88b2301b8afb73955438589915414c8a32969c50deadb04615953ef7b394e1f7',
    before: '  const dimensions = isImage ? (0, _imageSize.default)(isImageInput) : null;',
    after: [
      '  // Circle compatibility: image-size 2 accepts image bytes, not file paths.',
      '  const dimensions = isImage',
      '    ? (0, _imageSize.default)(',
      '        typeof isImageInput === "string"',
      '          ? _fs.default.readFileSync(isImageInput)',
      '          : isImageInput,',
      '      )',
      '    : null;',
    ].join('\n'),
  },
  {
    name: 'metro',
    version: '0.84.5',
    file: 'src/Assets.js',
    // Checked, not modified: this version calls its own lib/imageSize implementation.
    beforeHash: '9f7631691c4d2ed69915dba7d64d710d0d9ac4989dfc0483044a13b135a9e289',
    afterHash: '9f7631691c4d2ed69915dba7d64d710d0d9ac4989dfc0483044a13b135a9e289',
  },
];
const hash = (value) => createHash('sha256').update(value).digest('hex');
const changes = [];
// Check every version and file before writing any patch, including already patched files.
for (const patch of patches) {
  for (const copy of installed.get(patch.name)) {
    if (copy.version !== patch.version) continue;
    const file = path.join(copy.directory, patch.file);
    const current = fs.readFileSync(file, 'utf8');
    const digest = hash(current);
    if (digest === patch.afterHash) continue;
    if (digest !== patch.beforeHash || current.split(patch.before).length !== 2) {
      throw new Error(`Circle: unexpected ${patch.name}/${patch.file} source. Review the parser compatibility patch.`);
    }
    if (checkOnly) throw new Error(`Circle: ${patch.name} compatibility patch is missing. Run npm ci without --ignore-scripts.`);
    const updated = current.replace(patch.before, patch.after);
    if (hash(updated) !== patch.afterHash) throw new Error(`Circle: invalid expected patch for ${patch.name}.`);
    changes.push({ file, updated });
  }
}
for (const { file, updated } of changes) fs.writeFileSync(file, updated);
console.info(checkOnly ? 'SDK parser versions and compatibility patches verified.' : `SDK parser compatibility ready (${changes.length} files patched).`);
