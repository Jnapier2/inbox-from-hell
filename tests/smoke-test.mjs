import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFile, readdir, stat } from 'node:fs/promises';
import { extname, dirname, relative, resolve, sep } from 'node:path';
import { TextDecoder } from 'node:util';
import { fileURLToPath } from 'node:url';

import { ACTION_CATALOG } from '../src/content/actionCatalog.js';
import { SHIFTS } from '../src/content/shifts.js';
import { TICKETS } from '../src/content/tickets.js';
import { GameEngine } from '../src/core/GameEngine.js';
import { CURRENT_SAVE_SCHEMA, SaveManager } from '../src/core/SaveManager.js';
import { renderApp } from '../src/ui/templates.js';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const utf8 = new TextDecoder('utf-8', { fatal: true });

const expectedFiles = [
  '.gitattributes',
  '.github/dependabot.yml',
  '.github/workflows/ci.yml',
  '.gitignore',
  'LICENSE.md',
  'PRIVACY.md',
  'README.md',
  'SECURITY.md',
  'THIRD_PARTY_NOTICES.md',
  '_headers',
  'assets/cover.png',
  'assets/screenshot-inbox.jpg',
  'assets/screenshot-mobile.jpg',
  'assets/screenshot-shift-audit.jpg',
  'index.html',
  'netlify.toml',
  'package.json',
  'src/content/actionCatalog.js',
  'src/content/shifts.js',
  'src/content/tickets.js',
  'src/core/GameEngine.js',
  'src/core/SaveManager.js',
  'src/core/utils.js',
  'src/main.js',
  'src/styles.css',
  'src/ui/UIController.js',
  'src/ui/templates.js',
  'tests/smoke-test.mjs'
].sort();

async function run() {
  validateContent();
  const completedEngine = validateFiveShiftPlaythrough();
  validatePersistence(completedEngine.state);
  await validatePublicationScope();

  console.log('✓ Content integrity');
  console.log(`  ${TICKETS.length} tickets across ${SHIFTS.length} shifts`);
  console.log('✓ Complete five-shift playthrough');
  console.log('✓ Save round-trip and protected recovery paths');
  console.log('✓ Syntax, UTF-8, assets, entry points, and repository scope');
}

function validateContent() {
  assert.deepEqual(SHIFTS.map(shift => shift.id), [1, 2, 3, 4, 5], 'shift IDs should be contiguous');
  assert.ok(TICKETS.length >= 25, 'the game should retain a substantial authored ticket set');

  const ticketIds = new Set();
  for (const ticket of TICKETS) {
    assert.ok(ticket.id && !ticketIds.has(ticket.id), `ticket ID should be unique: ${ticket.id}`);
    ticketIds.add(ticket.id);
    assert.ok(SHIFTS.some(shift => shift.id === ticket.shiftId), `${ticket.id} should reference a known shift`);
    assert.ok(ticket.subject && ticket.from && ticket.mailbox, `${ticket.id} should include complete mail metadata`);
    assert.ok(Array.isArray(ticket.body) && ticket.body.length >= 2, `${ticket.id} should include readable body copy`);

    const actions = Object.entries(ticket.actions ?? {});
    assert.ok(actions.length >= 3, `${ticket.id} should offer at least three choices`);
    for (const [actionId, outcome] of actions) {
      assert.ok(ACTION_CATALOG[actionId], `${ticket.id} should use a known action: ${actionId}`);
      assert.ok(outcome.preview && outcome.outcomeTitle && outcome.outcome, `${ticket.id}/${actionId} should be fully authored`);
      for (const value of Object.values(outcome.delta ?? {})) {
        assert.ok(Number.isFinite(value), `${ticket.id}/${actionId} should use finite metric changes`);
      }
      for (const scheduledId of outcome.schedule ?? []) {
        assert.ok(TICKETS.some(candidate => candidate.id === scheduledId), `${ticket.id}/${actionId} should schedule a known ticket`);
      }
    }
  }

  for (const shift of SHIFTS) {
    const authored = TICKETS.filter(ticket => ticket.shiftId === shift.id && ticket.defaultAvailable !== false);
    assert.ok(authored.length >= 5, `shift ${shift.id} should include at least five default tickets`);
  }
}

function validateFiveShiftPlaythrough() {
  let now = 1_700_000_000_000;
  const engine = new GameEngine({ now: () => now });
  const initialMarkup = renderApp(engine.getSnapshot(), {
    query: '',
    filter: 'open',
    rightTab: 'ops',
    modal: null
  });
  assert.ok(initialMarkup.includes('Inbox From Hell'), 'initial interface should render');
  assert.ok(initialMarkup.includes('data-action="resolve-ticket"'), 'initial interface should expose response choices');

  for (const shift of SHIFTS) {
    assert.equal(engine.state.activeShiftId, shift.id, `shift ${shift.id} should open in sequence`);
    assert.equal(engine.state.phase, 'ticketing', `shift ${shift.id} should accept tickets`);

    while (engine.getOpenTicketIds().length > 0) {
      const nextTicketId = engine.getOpenTicketIds()[0];
      assert.equal(engine.selectTicket(nextTicketId), true, `${nextTicketId} should be selectable`);
      const action = engine.getSnapshot().actionList[0];
      assert.ok(action, `${nextTicketId} should have a playable response`);
      assert.equal(engine.resolveSelectedTicket(action.id).ok, true, `${nextTicketId} should resolve`);
      assert.notEqual(engine.state.phase, 'gameOver', `baseline path should survive shift ${shift.id}`);
      now += 10_000;
    }

    assert.equal(engine.endShift('cleared'), true, `shift ${shift.id} should close cleanly`);
    assert.equal(engine.state.phase, 'shiftSummary', `shift ${shift.id} should produce an audit`);
    assert.equal(engine.advanceShift(), true, `shift ${shift.id} should advance`);
  }

  assert.equal(engine.state.phase, 'demoComplete', 'the fifth audit should complete the game');
  assert.equal(engine.state.shiftHistory.length, 5, 'all five shift audits should be retained');
  assert.equal(engine.state.failureReason, null, 'baseline path should complete without failure');
  return engine;
}

function validatePersistence(state) {
  const storage = createMemoryStorage();
  const writer = new SaveManager({ storage, storageKey: 'round-trip' });
  assert.equal(writer.load(), null, 'an empty store should start cleanly');
  assert.equal(writer.save(state), true, 'progress should save');

  const rawSave = storage.getItem('round-trip');
  assert.ok(rawSave, 'saved progress should be present');
  const reader = new SaveManager({ storage, storageKey: 'round-trip' });
  const loaded = reader.load();
  assert.equal(loaded.runId, state.runId, 'round-trip should preserve the run ID');
  assert.equal(loaded.phase, state.phase, 'round-trip should preserve the phase');
  assert.deepEqual(loaded.handled, state.handled, 'round-trip should preserve decisions');
  assert.ok(loaded.saveRevision >= 1, 'saved progress should carry a revision');

  const imported = reader.import(reader.export(loaded));
  assert.deepEqual(imported.handled, loaded.handled, 'export and import should preserve decisions');

  const corruptStorage = createMemoryStorage();
  const corruptRaw = '{broken json';
  corruptStorage.setItem('protected', corruptRaw);
  const corruptManager = new SaveManager({ storage: corruptStorage, storageKey: 'protected' });
  withMutedWarnings(() => {
    assert.equal(corruptManager.load(), null, 'corrupt progress should not load');
    assert.equal(corruptManager.save(state), false, 'corrupt progress should not be overwritten automatically');
  });
  assert.equal(corruptManager.saveBlocked, true, 'corrupt progress should activate overwrite protection');
  assert.equal(corruptStorage.getItem('protected'), corruptRaw, 'corrupt raw data should remain recoverable');

  const futureStorage = createMemoryStorage();
  const futureState = { ...state, runId: 'future-run', saveSchema: CURRENT_SAVE_SCHEMA + 1 };
  const futureRaw = JSON.stringify(futureState);
  futureStorage.setItem('future', futureRaw);
  const futureManager = new SaveManager({ storage: futureStorage, storageKey: 'future' });
  withMutedWarnings(() => {
    assert.equal(futureManager.load(), null, 'newer progress should not load in an older build');
    assert.equal(futureManager.save(state), false, 'newer progress should not be overwritten automatically');
  });
  assert.equal(futureStorage.getItem('future'), futureRaw, 'newer progress should remain byte-for-byte intact');
  assert.throws(() => reader.import(futureRaw), /newer than this build supports/, 'imports should reject newer schemas');
}

async function validatePublicationScope() {
  const files = await listFiles(projectRoot);
  assert.deepEqual(files, expectedFiles, 'repository should contain only the reviewed publication set');

  const packageJson = JSON.parse(await readFile(resolve(projectRoot, 'package.json'), 'utf8'));
  assert.equal(packageJson.private, true, 'accidental package publication should be disabled');
  assert.equal(packageJson.license, 'UNLICENSED', 'package metadata should not imply an open-source grant');
  assert.equal(packageJson.homepage, 'https://inbox-from-hell-demo.netlify.app/', 'package metadata should identify the official demo');
  assert.equal(packageJson.scripts.test, 'node tests/smoke-test.mjs', 'the acceptance test should be the default test command');

  const textFiles = files.filter(isTextFile);
  const prohibitedTerms = [
    ['chat', 'gpt'].join(''),
    ['google', ' drive'].join(''),
    ['g', 'drive'].join(''),
    ['export', '20'].join(''),
    ['hand', 'off'].join(''),
    ['play', 'test.bat'].join(''),
    ['new thread', ' project parameters'].join(''),
    ['source', '_of_truth'].join('')
  ];

  for (const file of textFiles) {
    const bytes = await readFile(resolve(projectRoot, file));
    const text = utf8.decode(bytes);
    assert.ok(!/[\u0080-\u009f\ufffd]/u.test(text), `${file} should not contain control or replacement characters`);
    assert.ok(!/[\u00c2\u00c3\u00e2]/u.test(text), `${file} should not contain common mojibake markers`);
    for (const term of prohibitedTerms) {
      assert.ok(!text.toLowerCase().includes(term), `${file} should not contain private workflow terminology`);
    }
  }

  const javascriptFiles = files.filter(file => file.endsWith('.js') || file.endsWith('.mjs'));
  for (const file of javascriptFiles) {
    const result = spawnSync(process.execPath, ['--check', resolve(projectRoot, file)], { encoding: 'utf8' });
    assert.equal(result.status, 0, `${file} should pass syntax check: ${result.stderr}`);
  }

  const indexText = await readFile(resolve(projectRoot, 'index.html'), 'utf8');
  for (const match of indexText.matchAll(/(?:href|src)="([^"#]+)"/g)) {
    if (/^[a-z]+:/i.test(match[1])) continue;
    const linkedPath = resolve(projectRoot, match[1]);
    assert.ok((await stat(linkedPath)).isFile(), `browser entry point should resolve ${match[1]}`);
  }

  const runtimeText = await Promise.all(
    files
      .filter(file => file === 'index.html' || file.startsWith('src/'))
      .filter(isTextFile)
      .map(file => readFile(resolve(projectRoot, file), 'utf8'))
  );
  assert.ok(!/\b(?:fetch|XMLHttpRequest|WebSocket|EventSource)\b/.test(runtimeText.join('\n')), 'runtime should not make network requests');

  const headers = await readFile(resolve(projectRoot, '_headers'), 'utf8');
  assert.ok(headers.includes('Content-Security-Policy:'), 'hosting headers should include a content security policy');
  assert.ok(headers.includes("connect-src 'none'"), 'content security policy should block outbound connections');
  assert.ok(!headers.includes('frame-ancestors *'), 'content security policy should not allow arbitrary framing');
  assert.ok(headers.includes('X-Content-Type-Options: nosniff'), 'hosting headers should prevent MIME sniffing');

  const license = await readFile(resolve(projectRoot, 'LICENSE.md'), 'utf8');
  assert.ok(license.includes('All Rights Reserved'), 'license notice should preserve ownership');
  assert.ok(license.includes('source-visible'), 'license notice should describe the publication model');
  assert.ok(license.includes('not open-source software'), 'license notice should make licensing status explicit');

  const netlifyConfig = await readFile(resolve(projectRoot, 'netlify.toml'), 'utf8');
  assert.match(netlifyConfig, /publish\s*=\s*"\."/, 'deployment should publish the reviewed repository root');
  assert.ok(!/^\s*command\s*=/m.test(netlifyConfig), 'deployment should not require a build command');

  const readme = await readFile(resolve(projectRoot, 'README.md'), 'utf8');
  assert.ok(readme.includes(packageJson.homepage), 'README should link to the official demo');

  const assets = files.filter(file => file.startsWith('assets/') && /\.(?:png|jpg)$/.test(file));
  assert.deepEqual(assets, [
    'assets/cover.png',
    'assets/screenshot-inbox.jpg',
    'assets/screenshot-mobile.jpg',
    'assets/screenshot-shift-audit.jpg'
  ], 'repository media should contain one cover and three screenshots');
  for (const asset of assets) {
    const bytes = await readFile(resolve(projectRoot, asset));
    assert.ok(bytes.length > 20_000, `${asset} should not be an empty placeholder`);
    if (asset.endsWith('.png')) {
      assert.deepEqual([...bytes.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10], `${asset} should be a PNG`);
    } else {
      assert.deepEqual([...bytes.subarray(0, 3)], [255, 216, 255], `${asset} should be a JPEG`);
    }
  }
}

function isTextFile(file) {
  return file === '_headers' || new Set(['.html', '.css', '.js', '.mjs', '.json', '.md', '.toml', '.yml', '.yaml']).has(extname(file));
}

async function listFiles(root, relativePath = '') {
  const directory = resolve(root, relativePath);
  const output = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name === '.git') continue;
    const child = relativePath ? `${relativePath}/${entry.name}` : entry.name;
    if (entry.isDirectory()) output.push(...await listFiles(root, child));
    if (entry.isFile()) output.push(relative(root, resolve(root, child)).split(sep).join('/'));
  }
  return output.sort();
}

function createMemoryStorage() {
  const data = new Map();
  return {
    getItem: key => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: key => data.delete(key)
  };
}

function withMutedWarnings(callback) {
  const originalWarn = console.warn;
  console.warn = () => {};
  try {
    return callback();
  } finally {
    console.warn = originalWarn;
  }
}

await run();
