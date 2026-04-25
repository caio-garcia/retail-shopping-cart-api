module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '.config.js',
    '/src/main.ts',
    '.module.ts',
    '.schema.ts',
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '.config.js',
    '/src/main.ts',
    '.module.ts',
    '.schema.ts',
    '.store.ts',
    '/common/',
  ],
  transformIgnorePatterns: ['node_modules/(?!(uuid)/)'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
