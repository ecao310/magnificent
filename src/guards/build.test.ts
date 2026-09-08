import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * The build's chunking rule reads "everything in node_modules that is not
 * React is the chart library", which is true only while recharts is the one
 * other runtime dependency. This holds that line.
 */
describe('the build’s chunking', () => {
  const pkg = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8')) as {
    dependencies: Record<string, string>;
  };

  it('rests on exactly three runtime dependencies', () => {
    expect(Object.keys(pkg.dependencies).sort()).toEqual(['react', 'react-dom', 'recharts']);
  });

  it('is configured with the repo’s own base', () => {
    const config = readFileSync(resolve(process.cwd(), 'vite.config.ts'), 'utf8');
    expect(config).toMatch(/base:\s*'\/super-duper-broccoli\/'/);
    expect(config).toMatch(/\['react', 'charts'\]/);
  });
});
