import { describe, expect, it } from 'vitest';

describe('api smoke', () => {
  it('env test defaults are loaded for vitest', () => {
    expect(process.env.JWT_ACCESS_SECRET).toMatch(/test-access/);
    expect(process.env.DATABASE_URL).toContain('postgresql://');
  });
});
