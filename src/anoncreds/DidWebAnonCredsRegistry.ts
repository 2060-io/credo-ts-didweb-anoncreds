import {
  AnonCredsCredentialDefinition,
  AnonCredsRegistry,
  AnonCredsSchema,
  GetCredentialDefinitionReturn,
  GetRevocationRegistryDefinitionReturn,
  GetRevocationStatusListReturn,
  GetSchemaReturn,
  RegisterCredentialDefinitionOptions,
  RegisterCredentialDefinitionReturn,
  RegisterSchemaOptions,
  RegisterSchemaReturn,
} from '@aries-framework/anoncreds'
import { AgentContext, DidsApi, utils } from '@aries-framework/core'
import { parse } from 'did-resolver'
import { parseUrl } from 'query-string'

export class DidWebAnonCredsRegistry implements AnonCredsRegistry {
  public readonly supportedIdentifier = /^did:web:[_a-z0-9.%A-]*/
  private didsApi: DidsApi

  public constructor(didsApi: DidsApi) {
    this.didsApi = didsApi
  }


  private async parseIdAndGetResource(agentContext: AgentContext, objectId: string) {
    const parsedDid = parse(objectId)

    if (!parsedDid) {
      throw new Error(`${objectId} is not a valid object identifier`)
    }

    if (parsedDid.method != 'web') {
        throw new Error('DidWebAnonCredsRegistry only supports did:web identifiers')
    }

    const didDocument = await this.didsApi.resolveDidDocument(parsedDid.did)

    const parsedUrl = parseUrl(objectId)
    const queriedService = parsedUrl.query['service']
    const relativeRef = parsedUrl.query['relativeRef']

    if (!queriedService || Array.isArray(queriedService)) {
      throw new Error('No valid service query present in the ID')
    }

    if (!relativeRef || Array.isArray(relativeRef)) {
      throw new Error('No valid relativeRef query present in the ID')
    }

    const baseEndpoint = didDocument.service?.find(service => service.id === `${parsedDid.did}#${queriedService}`)?.serviceEndpoint

    if (!baseEndpoint) {
      throw new Error(`No valid endpoint has been found for the service ${queriedService}`)
    }

    const fetchObjectUrl = `${baseEndpoint}${relativeRef}`
    agentContext.config.logger.debug(`getting AnonCreds object at URL: ${fetchObjectUrl}`)
    return await agentContext.config.agentDependencies.fetch(fetchObjectUrl, {"method": "GET"})
  }

  public async getSchema(agentContext: AgentContext, schemaId: string): Promise<GetSchemaReturn> {
    try {
      const response = await this.parseIdAndGetResource(agentContext, schemaId)
      if (response.status === 200) {
        return {
          schemaId,
          schema: (await response.json()) as AnonCredsSchema,
          schemaMetadata: {},
          resolutionMetadata: {},
        }
      } else {
        agentContext.config.logger.debug(`response: ${response.status}`)
        return {
          resolutionMetadata: { error: 'notFound' },
          schemaMetadata: {},
          schemaId,
        }
      }
    } catch (error) {
      return {
        resolutionMetadata: { error: 'invalid' },
        schemaMetadata: {},
        schemaId,
      }
    }
  }

  public async registerSchema(
    agentContext: AgentContext,
    options: RegisterSchemaOptions
  ): Promise<RegisterSchemaReturn> {
    // Nothing to actually do other than generating a schema id
    const schemaId = `${options.schema.issuerId}?service=anoncreds&relativeRef=/schema/${utils.uuid()}`
    return {
      schemaState: { state: 'finished', schema: options.schema, schemaId },
      registrationMetadata: {},
      schemaMetadata: {},
    }
  }

  public async getCredentialDefinition(
    agentContext: AgentContext,
    credentialDefinitionId: string
  ): Promise<GetCredentialDefinitionReturn> {
    try {
      const response = await this.parseIdAndGetResource(agentContext, credentialDefinitionId)
      if (response.status === 200) {
        return {
          credentialDefinitionId,
          credentialDefinition: (await response.json()) as AnonCredsCredentialDefinition,
          credentialDefinitionMetadata: {},
          resolutionMetadata: {},
        }
      } else {
        agentContext.config.logger.debug(`response: ${response.status}`)
        return {
          resolutionMetadata: { error: 'notFound' },
          credentialDefinitionMetadata: {},
          credentialDefinitionId,
        }
      }
    } catch (error) {
      return {
        resolutionMetadata: { error: 'invalid' },
        credentialDefinitionMetadata: {},
        credentialDefinitionId,
      }
    }
  }

  public async registerCredentialDefinition(
    agentContext: AgentContext,
    options: RegisterCredentialDefinitionOptions
  ): Promise<RegisterCredentialDefinitionReturn> {
    // Nothing to actually do other than generating a credential definition id
    const credentialDefinitionId = `${
      options.credentialDefinition.issuerId
    }?service=anoncreds&relativeRef=/credDef/${utils.uuid()}`

    return {
      credentialDefinitionState: {
        state: 'finished',
        credentialDefinition: options.credentialDefinition,
        credentialDefinitionId,
      },
      credentialDefinitionMetadata: {},
      registrationMetadata: {},
    }
  }

  public async getRevocationRegistryDefinition(): Promise<GetRevocationRegistryDefinitionReturn> {
    throw new Error('Method not implemented.')
  }

  public async getRevocationStatusList(): Promise<GetRevocationStatusListReturn> {
    throw new Error('Method not implemented.')
  }
}
