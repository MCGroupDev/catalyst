import { Command, Option } from 'commander';
import consola from 'consola';
import { execa } from 'execa';
import { join } from 'node:path';
import { getProjectConfig } from '../lib/project-config';
import { getModuleCliPath } from '../lib/get-module-cli-path';
import { copyFile, unlink } from 'node:fs/promises';
import { ChildProcess } from 'node:child_process';

export const start = new Command('start')
  .description('Start your Catalyst storefront in optimized production mode.')
  .addOption(
    new Option('--framework <framework>', 'The framework to use for the preview').choices([
      'catalyst',
      'nextjs',
    ]),
  )
  .option('-p, --port <number>', 'Port to run the production server on (default: 3000).', '3000')
  .option(
    '--root-dir <path>',
    'Path to the root directory of your Catalyst project (default: current working directory).',
    process.cwd(),
  )
  .action(async (options) => {
    try {
      const config = getProjectConfig(options.rootDir);

      // TODO: use `resolveFramework`
      const framework = options.framework || config.get('framework');

      if (framework !== 'catalyst' && framework !== 'nextjs') {
        throw new Error(`Unsupported framework: ${framework}`);
      }

      if (framework === 'nextjs') {
        const nextBin = join(options.rootDir, 'node_modules', '.bin', 'next');

        await execa(nextBin, ['start', '--port', options.port], {
          stdio: 'inherit',
          cwd: options.rootDir,
        });
      }

      await execa(
        'pnpm',
        [
          'dlx',
          '@opennextjs/cloudflare@1.6.5',
          'preview',
          '--port',
          options.port,
          '--config',
          '.bigcommerce/wrangler.jsonc',
        ],
        {
          stdio: 'inherit',
          cwd: options.rootDir,
        },
      );
    } catch (error) {
      consola.error(error instanceof Error ? error.message : error);
    }
  });
