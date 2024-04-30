import { AskarModule } from '@credo-ts/askar'
import { Agent, KeyDerivationMethod } from '@credo-ts/core'
import { agentDependencies } from '@credo-ts/node'
import { ariesAskar } from '@hyperledger/aries-askar-nodejs'
import { randomUUID } from 'node:crypto'

export const agent = new Agent({
  config: {
    label: 'test',
    walletConfig: {
      id: `anoncreds-${randomUUID()}`,
      key: ariesAskar.storeGenerateRawKey({}),
      keyDerivationMethod: KeyDerivationMethod.Raw,
    },
  },
  dependencies: agentDependencies,
  modules: {
    askar: new AskarModule({
      ariesAskar,
    }),
  },
})
