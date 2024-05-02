import { DidWebAnonCredsRegistry } from '../src/anoncreds'
import didDocument1 from './__fixtures__/did1.json'
import didDocument2 from './__fixtures__/did2.json'
import schema1 from './__fixtures__/schema1.json'
import schemaGtDjznsWvUNPFaLvaBjayZ5UUtM2RCjVDtgDVqbyDkTG from './__fixtures__/GtDjznsWvUNPFaLvaBjayZ5UUtM2RCjVDtgDVqbyDkTG.json'
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

  test('throws error when issuerId does not match with did', async () => {
    const schema = {
      ...schema1,
      issuerId: 'random',
    }
    const resourceId = calculateResourceId(schema)

    // did document
    nock('https://ca.dev.2060.io').get('/.well-known/did.json').reply(200, didDocument1)

    // Get schema
    nock('https://anoncreds.ca.dev.2060.io').get(`/v1/schema/${resourceId}`).reply(200, {
      resource: schema,
      resourceMetadata: {},
    })

    const registry = new DidWebAnonCredsRegistry()

    const schemaResponse = await registry.getSchema(
      agent.context,
      `did:web:ca.dev.2060.io?service=anoncreds&relativeRef=/schema/${resourceId}`
    )

    expect(schemaResponse).toEqual({
      resolutionMetadata: {
        error: 'invalid',
        message: 'issuerId in schema (random) does not match the did (did:web:ca.dev.2060.io)',
      },
      schemaId: `did:web:ca.dev.2060.io?service=anoncreds&relativeRef=/schema/${resourceId}`,
      schemaMetadata: {},
    })
  })

  test('register and resolve did document with nested path', async () => {
    const registry = new DidWebAnonCredsRegistry()

    const result = await registry.registerSchema(agent.context, {
      options: {},
      schema: schemaGtDjznsWvUNPFaLvaBjayZ5UUtM2RCjVDtgDVqbyDkTG.resource,
    })

    expect(result).toMatchObject({
      schemaState: {
        state: 'finished',
        schemaId:
          'did:web:nnu4z2pauw49.share.zrok.io:paradym-public-metadata:440ef8ba-36f6-4362-bbac-391dc47e2747?service=anoncreds&relativeRef=/schema/GtDjznsWvUNPFaLvaBjayZ5UUtM2RCjVDtgDVqbyDkTG',
      },
    })

    // did document
    nock('https://nnu4z2pauw49.share.zrok.io')
      .get('/paradym-public-metadata/440ef8ba-36f6-4362-bbac-391dc47e2747/did.json')
      .reply(200, didDocument2)

      // Get schema
      .get(
        `/paradym-public-metadata/440ef8ba-36f6-4362-bbac-391dc47e2747/anoncreds/schema/GtDjznsWvUNPFaLvaBjayZ5UUtM2RCjVDtgDVqbyDkTG`
      )
      .reply(200, schemaGtDjznsWvUNPFaLvaBjayZ5UUtM2RCjVDtgDVqbyDkTG)

    const schemaResponse = await registry.getSchema(
      agent.context,
      'did:web:nnu4z2pauw49.share.zrok.io:paradym-public-metadata:440ef8ba-36f6-4362-bbac-391dc47e2747?service=anoncreds&relativeRef=/schema/GtDjznsWvUNPFaLvaBjayZ5UUtM2RCjVDtgDVqbyDkTG'
    )

    expect(schemaResponse).toEqual({
      resolutionMetadata: {},
      schema: schemaGtDjznsWvUNPFaLvaBjayZ5UUtM2RCjVDtgDVqbyDkTG.resource,
      schemaId:
        'did:web:nnu4z2pauw49.share.zrok.io:paradym-public-metadata:440ef8ba-36f6-4362-bbac-391dc47e2747?service=anoncreds&relativeRef=/schema/GtDjznsWvUNPFaLvaBjayZ5UUtM2RCjVDtgDVqbyDkTG',
      schemaMetadata: {},
    })
  })
})
