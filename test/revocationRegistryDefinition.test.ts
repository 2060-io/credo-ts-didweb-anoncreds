import { DidWebAnonCredsRegistry } from '../src/anoncreds'
import didDocument1 from './__fixtures__/did1.json'
import revocationRegistryDefinition1 from './__fixtures__/revocationRegistryDefinition1.json'
import nock, { cleanAll, enableNetConnect } from 'nock'
import { agent } from './agent'
import { calculateResourceId } from '../src/anoncreds/utils'

describe('Revocation Registry Definition', () => {
  beforeAll(async () => {
    await agent.initialize()
  })

  afterEach(() => {
    cleanAll()
    enableNetConnect()
  })

  test('resolves revocation registry definition correctly', async () => {
    const resourceId = calculateResourceId(revocationRegistryDefinition1)

    // did document
    nock('https://ca.dev.2060.io').get('/.well-known/did.json').reply(200, didDocument1)

    // Get schema
    nock('https://anoncreds.ca.dev.2060.io')
      .get(`/v1/revocation-registry/${resourceId}`)
      .reply(200, {
        resource: revocationRegistryDefinition1,
        resourceMetadata: {
          revocationStatusListEndpoint: 'https://mydomain.com/revStatus/5762v4VZxFMLB5n9X4Upr3gXaCKTa8PztDDCnroauSsR',
        },
      })

    const registry = new DidWebAnonCredsRegistry()

    const schemaResponse = await registry.getRevocationRegistryDefinition(
      agent.context,
      `did:web:ca.dev.2060.io?service=anoncreds&relativeRef=/revocation-registry/${resourceId}`
    )

    expect(schemaResponse).toEqual({
      resolutionMetadata: {},
      revocationRegistryDefinition: revocationRegistryDefinition1,
      revocationRegistryDefinitionId: `did:web:ca.dev.2060.io?service=anoncreds&relativeRef=/revocation-registry/${resourceId}`,
      revocationRegistryDefinitionMetadata: {
        revocationStatusListEndpoint: 'https://mydomain.com/revStatus/5762v4VZxFMLB5n9X4Upr3gXaCKTa8PztDDCnroauSsR',
      },
    })
  })

  test('throws error when revocation registry definition resourceId does not match', async () => {
    // did document
    nock('https://ca.dev.2060.io').get('/.well-known/did.json').reply(200, didDocument1)

    // Get schema
    nock('https://anoncreds.ca.dev.2060.io').get(`/v1/revocation-registry/1234`).reply(200, {
      resource: revocationRegistryDefinition1,
      resourceMetadata: {},
    })

    const registry = new DidWebAnonCredsRegistry()

    const revocationRegistryDefinitionResponse = await registry.getRevocationRegistryDefinition(
      agent.context,
      `did:web:ca.dev.2060.io?service=anoncreds&relativeRef=/revocation-registry/1234`
    )

    expect(revocationRegistryDefinitionResponse).toEqual({
      resolutionMetadata: {
        error: 'invalid',
        message: 'Wrong resource Id',
      },
      revocationRegistryDefinitionId: 'did:web:ca.dev.2060.io?service=anoncreds&relativeRef=/revocation-registry/1234',
      revocationRegistryDefinitionMetadata: {},
    })
  })
})
