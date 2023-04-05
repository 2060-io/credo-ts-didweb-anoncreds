import {
  AnonCredsCredentialDefinition,
  AnonCredsRegistry,
  AnonCredsRevocationRegistryDefinition,
  AnonCredsRevocationStatusList,
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
import { AgentContext, DidsApi } from '@aries-framework/core'
import { parse } from 'did-resolver'
import { parseUrl } from 'query-string'
import { AnonCredsObjectResolutionResult } from './AnonCredsObjectResolutionResult'
import { calculateObjectId, verifyObjectId } from './utils'

export class DidWebAnonCredsRegistry implements AnonCredsRegistry {
  public readonly methodName = 'web'

  public readonly supportedIdentifier = /^did:web:[_a-z0-9.%A-]*/

  public async getSchema(agentContext: AgentContext, schemaId: string): Promise<GetSchemaReturn> {
    try {
      const { response, objectId } = await this.parseIdAndFetchObject(agentContext, schemaId)

      if (response.status === 200) {
        const result = (await response.json()) as AnonCredsObjectResolutionResult
        const schema = result.object as unknown as AnonCredsSchema
        const schemaMetadata = result.objectMetadata
        if (!verifyObjectId(schema, objectId)) {
          throw new Error('Wrong object Id')
        }

        return {
          schemaId,
          schema,
          schemaMetadata,
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
    const objectId = calculateObjectId(options.schema)

    const schemaId = `${options.schema.issuerId}?service=anoncreds&relativeRef=/schema/${objectId}`
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
      const { response, objectId } = await this.parseIdAndFetchObject(agentContext, credentialDefinitionId)
      if (response.status === 200) {
        const result = (await response.json()) as AnonCredsObjectResolutionResult
        const credentialDefinition = result.object as unknown as AnonCredsCredentialDefinition
        const credentialDefinitionMetadata = result.objectMetadata

        if (!verifyObjectId(credentialDefinition, objectId)) {
          throw new Error('Wrong object Id')
        }

        return {
          credentialDefinitionId,
          credentialDefinition,
          credentialDefinitionMetadata,
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
    const objectId = calculateObjectId(options.credentialDefinition)

    const credentialDefinitionId = `${options.credentialDefinition.issuerId}?service=anoncreds&relativeRef=/credDef/${objectId}`

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

  public async getRevocationRegistryDefinition(
    agentContext: AgentContext,
    revocationRegistryDefinitionId: string
  ): Promise<GetRevocationRegistryDefinitionReturn> {
    try {
      const { response, objectId } = await this.parseIdAndFetchObject(agentContext, revocationRegistryDefinitionId)
      if (response.status === 200) {
        const result = (await response.json()) as AnonCredsObjectResolutionResult
        const revocationRegistryDefinition = result.object as unknown as AnonCredsRevocationRegistryDefinition
        const revocationRegistryDefinitionMetadata = result.objectMetadata

        if (!verifyObjectId(revocationRegistryDefinition, objectId)) {
          throw new Error('Wrong object Id')
        }

        return {
          revocationRegistryDefinitionId,
          revocationRegistryDefinition,
          revocationRegistryDefinitionMetadata,
          resolutionMetadata: {},
        }
      } else {
        agentContext.config.logger.debug(`response: ${response.status}`)
        return {
          resolutionMetadata: { error: 'notFound' },
          revocationRegistryDefinitionMetadata: {},
          revocationRegistryDefinitionId,
        }
      }
    } catch (error) {
      return {
        resolutionMetadata: { error: 'invalid' },
        revocationRegistryDefinitionMetadata: {},
        revocationRegistryDefinitionId,
      }
    }
  }

  public async getRevocationStatusList(
    agentContext: AgentContext,
    revocationRegistryId: string,
    timestamp: number
  ): Promise<GetRevocationStatusListReturn> {
    try {
      // TODO: use cache to get Revocation Registry Definition data without fetching it again
      const revRegDefResult = await this.getRevocationRegistryDefinition(agentContext, revocationRegistryId)

      const baseEndpoint = revRegDefResult.revocationRegistryDefinitionMetadata.statusListEndpoint

      if (!baseEndpoint) {
        throw new Error(`No revocation status list endpoint has been found for ${revocationRegistryId}`)
      }

      const response = await agentContext.config.agentDependencies.fetch(`${baseEndpoint}/${timestamp}`, {
        method: 'GET',
      })

      if (response.status === 200) {
        const result = (await response.json()) as AnonCredsObjectResolutionResult
        const revocationStatusList = result.object as unknown as AnonCredsRevocationStatusList
        const revocationStatusListMetadata = result.objectMetadata

        return {
          revocationStatusList,
          revocationStatusListMetadata,
          resolutionMetadata: {},
        }
      } else {
        agentContext.config.logger.debug(`response: ${response.status}`)
        return {
          resolutionMetadata: { error: 'notFound' },
          revocationStatusListMetadata: {},
        }
      }
    } catch (error) {
      return {
        resolutionMetadata: { error: 'invalid' },
        revocationStatusListMetadata: {},
      }
    }
  }

  private async parseIdAndFetchObject(agentContext: AgentContext, didUrl: string) {
    const parsedDid = parse(didUrl)

    if (!parsedDid) {
      throw new Error(`${didUrl} is not a valid object identifier`)
    }

    if (parsedDid.method != 'web') {
      throw new Error('DidWebAnonCredsRegistry only supports did:web identifiers')
    }

    const didsApi = agentContext.dependencyManager.resolve(DidsApi)
    const didDocument = await didsApi.resolveDidDocument(parsedDid.did)

    const parsedUrl = parseUrl(didUrl)
    const queriedService = parsedUrl.query['service']
    const relativeRef = parsedUrl.query['relativeRef']

    if (!queriedService || Array.isArray(queriedService)) {
      throw new Error('No valid service query present in the ID')
    }

    if (!relativeRef || Array.isArray(relativeRef)) {
      throw new Error('No valid relativeRef query present in the ID')
    }

    // The last segment of relativeRef is the objectId
    const objectId = relativeRef.split('/').pop()

    if (!objectId) {
      throw new Error('Could not get objectId from relativeRef')
    }

    const baseEndpoint = didDocument.service?.find(
      (service) => service.id === `${parsedDid.did}#${queriedService}`
    )?.serviceEndpoint

    if (!baseEndpoint) {
      throw new Error(`No valid endpoint has been found for the service ${queriedService}`)
    }

    const fetchObjectUrl = `${baseEndpoint}${relativeRef}`
    agentContext.config.logger.debug(`getting AnonCreds object at URL: ${fetchObjectUrl}`)
    return { response: await agentContext.config.agentDependencies.fetch(fetchObjectUrl, { method: 'GET' }), objectId }
  }
}
