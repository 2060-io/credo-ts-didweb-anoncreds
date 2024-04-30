import { DidWebAnonCredsRegistry } from '../src/anoncreds'
import didDocument1 from './__fixtures__/did1.json'
import schema1 from './__fixtures__/schema1.json'
import nock, { cleanAll, enableNetConnect } from 'nock'
import { agent } from './agent'
import { calculateResourceId } from '../src/anoncreds/utils'

describe('Schema', () => {
  beforeAll(async () => {
    await agent.initialize()
  })

  afterEach(() => {
    cleanAll()
    enableNetConnect()
  })

  test('resolves schema correctly', async () => {
    const resourceId = calculateResourceId(schema1)

    // did document
    nock('https://ca.dev.2060.io').get('/.well-known/did.json').reply(200, didDocument1)

    // Get schema
    nock('https://anoncreds.ca.dev.2060.io').get(`/v1/schema/${resourceId}`).reply(200, {
      resource: schema1,
      resourceMetadata: {},
    })

    const registry = new DidWebAnonCredsRegistry()

    const schemaResponse = await registry.getSchema(
      agent.context,
      `did:web:ca.dev.2060.io?service=anoncreds&relativeRef=/schema/${resourceId}`
    )

    expect(schemaResponse).toEqual({
      resolutionMetadata: {},
      schema: schema1,
      schemaId: `did:web:ca.dev.2060.io?service=anoncreds&relativeRef=/schema/${resourceId}`,
      schemaMetadata: {},
    })
  })

  test('throws error when schema resourceId does not match', async () => {
    // did document
    nock('https://ca.dev.2060.io').get('/.well-known/did.json').reply(200, didDocument1)

    // Get schema
    nock('https://anoncreds.ca.dev.2060.io').get(`/v1/schema/1234`).reply(200, {
      resource: schema1,
      resourceMetadata: {},
    })

    const registry = new DidWebAnonCredsRegistry()

    const schemaResponse = await registry.getSchema(
      agent.context,
      `did:web:ca.dev.2060.io?service=anoncreds&relativeRef=/schema/1234`
    )

    expect(schemaResponse).toEqual({
      resolutionMetadata: {
        error: 'invalid',
        message: 'Wrong resource Id',
      },
      schemaId: 'did:web:ca.dev.2060.io?service=anoncreds&relativeRef=/schema/1234',
      schemaMetadata: {},
    })
  })
})
