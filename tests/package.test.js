"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const sourceRoot = path.join(root, "src");
const manifest = JSON.parse(
  fs.readFileSync(path.join(sourceRoot, "manifest.json"), "utf8")
);

assert.equal(manifest.manifest_version, 3);
assert.ok(manifest.action.default_popup);
assert.ok(manifest.background.scripts.length > 0);

const referencedFiles = [
  ...Object.values(manifest.icons),
  ...manifest.background.scripts,
  ...manifest.content_scripts.flatMap((entry) => entry.js),
  manifest.action.default_popup,
  ...Object.values(manifest.action.default_icon)
];

for (const relativeFile of referencedFiles) {
  assert.ok(
    fs.existsSync(path.join(sourceRoot, relativeFile)),
    `Arquivo referenciado não encontrado: ${relativeFile}`
  );
}

const popup = fs.readFileSync(
  path.join(sourceRoot, manifest.action.default_popup),
  "utf8"
);
assert.match(popup, /popup\.css/);
assert.match(popup, /popup\.js/);
assert.match(popup, /id="score"/);
assert.match(popup, /id="domain-list"/);

console.log("package.test.js: OK");
