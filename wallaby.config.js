module.exports = function (wallaby) {
  return {
    autoDetect: true, // Automatically detect test runner
    files: [
      'src/**/*.ts',
      'src/**/*.tsx',
      '!src/**/*.test.ts',
      '!src/**/*.test.tsx',
      '!src/**/*.spec.ts',
      '!src/**/*.spec.tsx',
      '!src/**/__tests__/**/*',
    ],
    tests: [
      'src/**/*.test.ts',
      'src/**/*.test.tsx',
      'src/**/*.spec.ts',
      'src/**/*.spec.tsx',
      'src/**/__tests__/**/*.ts',
      'src/**/__tests__/**/*.tsx',
    ],
    env: {
      type: 'node',
      runner: 'node'
    },
    testFramework: 'vitest',
    setup: async function (wallaby) {
      const vitestConfig = await import('./vitest.config.ts');
      wallaby.testFramework.configure(vitestConfig.default);
    },
    compilers: {
      '**/*.ts?(x)': wallaby.compilers.typeScript()
    },
    debug: true
  };
}; 