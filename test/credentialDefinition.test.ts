import { DidWebAnonCredsRegistry } from '../src/anoncreds'
import didDocument1 from './__fixtures__/did1.json'
import credentialDefinition1 from './__fixtures__/credentialDefinition1.json'
import nock, { cleanAll, enableNetConnect } from 'nock'
import { agent } from './agent'
import { calculateResourceId } from '../src/anoncreds/utils'

describe('Credential Definition', () => {
  beforeAll(async () => {
    await agent.initialize()
  })

  afterEach(() => {
    cleanAll()
    enableNetConnect()
  })

  test('resolves credential definition correctly', async () => {
    const resourceId = calculateResourceId(credentialDefinition1)

    // did document
    nock('https://ca.dev.2060.io').get('/.well-known/did.json').reply(200, didDocument1)

    // Get schema
    nock('https://anoncreds.ca.dev.2060.io').get(`/v1/credential-definition/${resourceId}`).reply(200, {
      resource: credentialDefinition1,
      resourceMetadata: {},
    })

    const registry = new DidWebAnonCredsRegistry()

    const credentialDefinitionResponse = await registry.getCredentialDefinition(
      agent.context,
      `did:web:ca.dev.2060.io?service=anoncreds&relativeRef=/credential-definition/${resourceId}`
    )

    expect(credentialDefinitionResponse).toEqual({
      resolutionMetadata: {},
      credentialDefinition: credentialDefinition1,
      credentialDefinitionId: `did:web:ca.dev.2060.io?service=anoncreds&relativeRef=/credential-definition/${resourceId}`,
      credentialDefinitionMetadata: {},
    })
  })

  test('throws error when credential definition resourceId does not match', async () => {
    // did document
    nock('https://ca.dev.2060.io').get('/.well-known/did.json').reply(200, didDocument1)

    // Get schema
    nock('https://anoncreds.ca.dev.2060.io').get(`/v1/credential-definition/1234`).reply(200, {
      resource: credentialDefinition1,
      resourceMetadata: {},
    })

    const registry = new DidWebAnonCredsRegistry()

    const credentialDefinitionResponse = await registry.getCredentialDefinition(
      agent.context,
      `did:web:ca.dev.2060.io?service=anoncreds&relativeRef=/credential-definition/1234`
    )

    expect(credentialDefinitionResponse).toEqual({
      resolutionMetadata: {
        error: 'invalid',
        message: 'Wrong resource Id',
      },
      credentialDefinitionId: 'did:web:ca.dev.2060.io?service=anoncreds&relativeRef=/credential-definition/1234',
      credentialDefinitionMetadata: {},
    })
  })

  test('throws error when issuerId does not match with did', async () => {
    const credentialDefinition = {
      ...credentialDefinition1,
      issuerId: 'random',
    }
    const resourceId = calculateResourceId(credentialDefinition)

    // did document
    nock('https://ca.dev.2060.io').get('/.well-known/did.json').reply(200, didDocument1)

    // Get schema
    nock('https://anoncreds.ca.dev.2060.io').get(`/v1/credential-definition/${resourceId}`).reply(200, {
      resource: credentialDefinition,
      resourceMetadata: {},
    })

    const registry = new DidWebAnonCredsRegistry()

    const credentialDefinitionResponse = await registry.getCredentialDefinition(
      agent.context,
      `did:web:ca.dev.2060.io?service=anoncreds&relativeRef=/credential-definition/${resourceId}`
    )

    expect(credentialDefinitionResponse).toEqual({
      resolutionMetadata: {
        error: 'invalid',
        message: 'issuerId in credential definition (random) does not match the did (did:web:ca.dev.2060.io)',
      },
      credentialDefinitionId: `did:web:ca.dev.2060.io?service=anoncreds&relativeRef=/credential-definition/${resourceId}`,
      credentialDefinitionMetadata: {},
    })
  })
})
