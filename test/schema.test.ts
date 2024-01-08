import { AgentConfig, AgentContext, DependencyManager, DidDocument, JsonTransformer } from '@aries-framework/core'
import { agentDependencies } from '@aries-framework/node'
import { DidWebAnonCredsRegistry } from '../src/anoncreds'
import didDocument1 from './__fixtures__/did1.json'

import { DidsApi } from '@aries-framework/core/build/modules/dids/DidsApi'

jest.mock('node-fetch')
import fetch, { Response } from 'node-fetch'

jest.mock('@aries-framework/core/build/modules/dids/DidsApi')
const DidsApiMock = DidsApi as jest.Mock<DidsApi>
const didsApiMock = new DidsApiMock()

function getAgentContext() {
  const dependencyManager = new DependencyManager()

  dependencyManager.registerInstance(AgentConfig, new AgentConfig({ label: 'mock' }, agentDependencies))
  dependencyManager.registerInstance(DidsApi, didsApiMock)
  const agentContext = new AgentContext({ dependencyManager, contextCorrelationId: 'mock' })

  agentContext.config
  return agentContext
}

// TODO: Fix fetch mocking and add tests for other objects
describe.skip('Schema', () => {
  test('parses schema id correctly', async () => {
    //@ts-ignore
    fetch.mockReturnValue(Promise.resolve(new Response(JSON.stringify(didDocument1))))

    jest.spyOn(didsApiMock, 'resolveDidDocument').mockResolvedValue(JsonTransformer.fromJSON(didDocument1, DidDocument))

    const registry = new DidWebAnonCredsRegistry()

    const schemaResponse = await registry.getSchema(
      getAgentContext(),
      'did:web:ca.dev.2060.io?service=anoncreds&relativeRef=/schema/1234'
    )
    console.log(schemaResponse)

    expect(fetch).toHaveBeenCalledWith('https://anoncreds.ca.dev.2060.io/v1/schema/1234', {
      method: 'GET',
    })
  })
})
