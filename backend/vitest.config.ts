import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Node.js environment for backend
    environment: 'node',
    // Global test configuration
    globals: true,
    // Include TypeScript files
    include: ['src/**/*.test.ts'],
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        '**/*.test.ts',
        'src/generated/**',
      ],
    },
  },
})
