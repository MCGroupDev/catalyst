import { Command } from 'commander';
import { execa } from 'execa';
import { afterAll, afterEach, beforeAll, beforeEach, expect, test, vi } from 'vitest';

import { start } from '../../src/commands/start';
import { program } from '../../src/program';
import consola from 'consola';
import { mkTempDir } from '../../src/lib/mk-temp-dir';

vi.mock('execa', () => ({
  execa: vi.fn(() => Promise.resolve({})),
  __esModule: true,
}));

vi.mock('../../src/lib/project-config', () => ({
  getProjectConfig: vi.fn(() => ({
    get: vi.fn((key) => {
      if (key === 'framework') {
        return 'catalyst';
      }
      return undefined;
    }),
  })),
}));

let tmpDir: string;
let cleanup: () => Promise<void>;

beforeAll(async () => {
  consola.wrapAll();
  [tmpDir, cleanup] = await mkTempDir();
});

beforeEach(() => {
  consola.mockTypes(() => vi.fn());
});

afterEach(() => {
  vi.clearAllMocks();
});

afterAll(async () => {
  await cleanup();
});

test('properly configured Command instance', () => {
  expect(start).toBeInstanceOf(Command);
  expect(start.name()).toBe('start');
  expect(start.description()).toBe('Start your Catalyst storefront in optimized production mode.');
  expect(start.options).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        flags: '--framework <framework>',
        argChoices: ['catalyst', 'nextjs'],
      }),
      expect.objectContaining({ flags: '-p, --port <number>', defaultValue: '3000' }),
      expect.objectContaining({ flags: '--root-dir <path>', defaultValue: process.cwd() }),
    ]),
  );
});

test('calls execa with Next.js production optimized server', async () => {
  await program.parseAsync([
    'node',
    'catalyst',
    'start',
    '--port',
    '3001',
    '--root-dir',
    tmpDir,
    '--framework',
    'nextjs',
  ]);

  expect(execa).toHaveBeenCalledWith(
    `${tmpDir}/node_modules/.bin/next`,
    ['start', '--port', '3001'],
    expect.objectContaining({
      stdio: 'inherit',
      cwd: tmpDir,
    }),
  );
});

test('calls execa with OpenNext production optimized server', async () => {
  await program.parseAsync([
    'node',
    'catalyst',
    'start',
    '--port',
    '3001',
    '--root-dir',
    tmpDir,
    '--framework',
    'catalyst',
  ]);

  expect(execa).toHaveBeenCalledWith(
    'pnpm',
    [
      'dlx',
      '@opennextjs/cloudflare@1.6.5',
      'preview',
      '--port',
      '3001',
      '--config',
      '.bigcommerce/wrangler.jsonc',
    ],
    expect.objectContaining({
      stdio: 'inherit',
      cwd: tmpDir,
    }),
  );
});
