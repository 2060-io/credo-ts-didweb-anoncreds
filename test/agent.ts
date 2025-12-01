import { randomUUID } from 'node:crypto'
import { AskarModule } from '@credo-ts/askar'
import { Agent } from '@credo-ts/core'
import { agentDependencies } from '@credo-ts/node'
import { askar } from '@openwallet-foundation/askar-nodejs'

export const agent = new Agent({
  dependencies: agentDependencies,
  modules: {
    askar: new AskarModule({
      askar,
      store: {
        id: `anoncreds-${randomUUID()}`,
        key: askar.storeGenerateRawKey({}),
        keyDerivationMethod: 'raw',
      },
    }),
  },
})
