// bump-version.mjs — bump the app version consistently across all three
// source-of-truth files: package.json, src-tauri/tauri.conf.json, src-tauri/Cargo.toml.
//
// Usage:
//   node scripts/bump-version.mjs            # bump patch from highest known version
//   node scripts/bump-version.mjs patch      # explicit patch bump
//   node scripts/bump-version.mjs minor      # minor bump
//   node scripts/bump-version.mjs major      # major bump
//   node scripts/bump-version.mjs 1.2.3      # set an explicit version
//
// The base version is the HIGHEST of package.json's version and the latest git
// tag (v-prefixed), so we never re-release a version that already shipped.
// Prints the resulting version as the last line of stdout.

import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkgPath = join(root, 'package.json');
const tauriPath = join(root, 'src-tauri', 'tauri.conf.json');
const cargoPath = join(root, 'src-tauri', 'Cargo.toml');

const SEMVER_RE = /^(\d+)\.(\d+)\.(\d+)$/;

function parseSemver(v) {
  const m = SEMVER_RE.exec(String(v).trim());
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

function compareSemver(a, b) {
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] - b[i];
  }
  return 0;
}

function latestGitTagVersion() {
  try {
    const tag = execSync('git describe --tags --abbrev=0', {
      cwd: root,
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim();
    return parseSemver(tag.replace(/^v/, ''));
  } catch {
    return null;
  }
}

function bump([maj, min, pat], kind) {
  if (kind === 'major') return [maj + 1, 0, 0];
  if (kind === 'minor') return [maj, min + 1, 0];
  return [maj, min, pat + 1]; // patch (default)
}

// --- Determine the new version ---
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
const pkgVer = parseSemver(pkg.version) ?? [0, 0, 0];
const arg = (process.argv[2] || 'patch').trim();

let newVer;
const explicit = parseSemver(arg);
if (explicit) {
  newVer = explicit;
} else if (['major', 'minor', 'patch'].includes(arg)) {
  const tagVer = latestGitTagVersion();
  const base = tagVer && compareSemver(tagVer, pkgVer) > 0 ? tagVer : pkgVer;
  newVer = bump(base, arg);
} else {
  console.error(`Invalid argument: "${arg}". Use patch|minor|major or X.Y.Z.`);
  process.exit(1);
}

const versionStr = newVer.join('.');

// --- Write package.json ---
pkg.version = versionStr;
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

// --- Write tauri.conf.json ---
const tauri = JSON.parse(readFileSync(tauriPath, 'utf8'));
tauri.version = versionStr;
writeFileSync(tauriPath, JSON.stringify(tauri, null, 2) + '\n');

// --- Write Cargo.toml (only the top-level [package] version line) ---
const cargo = readFileSync(cargoPath, 'utf8');
const updatedCargo = cargo.replace(/^version = ".*"/m, `version = "${versionStr}"`);
if (updatedCargo === cargo) {
  console.error('Warning: Cargo.toml version line not found/updated.');
}
writeFileSync(cargoPath, updatedCargo);

console.error(`Bumped version -> ${versionStr}`);
// Last stdout line = the version (consumed by release.bat)
console.log(versionStr);
