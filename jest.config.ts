import type { Config } from '@jest/types'

import packageJson from './package.json'

const esModules = [
  'query-string',
  'decode-uri-component',
  'split-on-first',
  'filter-obj',
];


const config: Config.InitialOptions = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  coveragePathIgnorePatterns: ['/build/', '/node_modules/', '/__tests__/', 'test'],
  coverageDirectory: '<rootDir>/coverage/',
  verbose: true,
  testMatch: ['**/?(*.)+(spec|test).[tj]s?(x)'],
  name: packageJson.name,
  displayName: packageJson.name,
  testTimeout: 15000,
  moduleFileExtensions: [
    "ts",
    "tsx",
    "js",
    "jsx"
  ],
  transformIgnorePatterns: esModules.length ? [`/node_modules/(?!${esModules.join('|')})`] : [],
}

export default config
