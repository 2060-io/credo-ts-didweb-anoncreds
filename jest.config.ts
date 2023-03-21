import type { Config } from '@jest/types'

import packageJson from './package.json'

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  coveragePathIgnorePatterns: ['/build/', '/node_modules/', '/__tests__/', 'test'],
  coverageDirectory: '<rootDir>/coverage/',
  verbose: true,
  testMatch: ['**/?(*.)+(spec|test).[tj]s?(x)'],
  name: packageJson.name,
  displayName: packageJson.name,
  setupFilesAfterEnv: ['./test/setup.ts'],
  testTimeout: 15000,
}

export default config
