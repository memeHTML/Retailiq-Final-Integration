import { readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import process from 'node:process';
import { startVitest } from 'vitest/node';

const root = process.cwd();
const srcDir = join(root, 'src');

function collectTestFiles(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectTestFiles(fullPath));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith('.test.tsx')) {
      files.push(fullPath);
    }
  }

  return files;
}

const testFiles = collectTestFiles(srcDir).sort((a, b) => a.localeCompare(b));

if (testFiles.length === 0) {
  console.log('No test files found.');
  process.exit(0);
}

for (const file of testFiles) {
  const display = relative(root, file).split(sep).join('/');
  console.log(`\n> vitest run ${display}`);

  process.exitCode = 0;

  await startVitest(
    'test',
    [file],
    {
      root,
      config: false,
      run: true,
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test/setup.ts'],
      fileParallelism: false,
      pool: 'threads',
      poolOptions: {
        threads: {
          singleThread: true,
        },
      },
    },
    {
      resolve: {
        preserveSymlinks: true,
        alias: {
          '@': join(root, 'src'),
        },
      },
    },
  );

  if ((process.exitCode ?? 0) !== 0) {
    process.exit(process.exitCode ?? 1);
  }
}
