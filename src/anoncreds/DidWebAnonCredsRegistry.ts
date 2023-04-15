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
import { AnonCredsResourceResolutionResult } from './AnonCredsResourceResolutionResult'
import { calculateResourceId, verifyResourceId } from './utils'

export class DidWebAnonCredsRegistry implements AnonCredsRegistry {
  public readonly methodName = 'web'

  public readonly supportedIdentifier = /^did:web:[_a-z0-9.%A-]*/

  public async getSchema(agentContext: AgentContext, schemaId: string): Promise<GetSchemaReturn> {
    try {
      const { response, resourceId } = await this.parseIdAndFetchResource(agentContext, schemaId)

      if (response.status === 200) {
        const result = (await response.json()) as AnonCredsResourceResolutionResult
        const schema = result.resource as unknown as AnonCredsSchema
        const schemaMetadata = result.resourceMetadata
        if (!verifyResourceId(schema, resourceId)) {
          throw new Error('Wrong resource Id')
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
    const resourceId = calculateResourceId(options.schema)

    const schemaId = `${options.schema.issuerId}?service=anoncreds&relativeRef=/schema/${resourceId}`
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
      const { response, resourceId } = await this.parseIdAndFetchResource(agentContext, credentialDefinitionId)
      if (response.status === 200) {
        const result = (await response.json()) as AnonCredsResourceResolutionResult
        const credentialDefinition = result.resource as unknown as AnonCredsCredentialDefinition
        const credentialDefinitionMetadata = result.resourceMetadata

        if (!verifyResourceId(credentialDefinition, resourceId)) {
          throw new Error('Wrong resource Id')
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
    const resourceId = calculateResourceId(options.credentialDefinition)

    const credentialDefinitionId = `${options.credentialDefinition.issuerId}?service=anoncreds&relativeRef=/credDef/${resourceId}`

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
      const { response, resourceId } = await this.parseIdAndFetchResource(agentContext, revocationRegistryDefinitionId)
      if (response.status === 200) {
        const result = (await response.json()) as AnonCredsResourceResolutionResult
        const revocationRegistryDefinition = result.resource as unknown as AnonCredsRevocationRegistryDefinition
        const revocationRegistryDefinitionMetadata = result.resourceMetadata

        if (!verifyResourceId(revocationRegistryDefinition, resourceId)) {
          throw new Error('Wrong resource Id')
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
        const result = (await response.json()) as AnonCredsResourceResolutionResult
        const revocationStatusList = result.resource as unknown as AnonCredsRevocationStatusList
        const revocationStatusListMetadata = result.resourceMetadata

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

  private async parseIdAndFetchResource(agentContext: AgentContext, didUrl: string) {
    const parsedDid = parse(didUrl)

    if (!parsedDid) {
      throw new Error(`${didUrl} is not a valid resource identifier`)
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

    // The last segment of relativeRef is the resourceId
    const resourceId = relativeRef.split('/').pop()

    if (!resourceId) {
      throw new Error('Could not get resourceId from relativeRef')
    }

    const baseEndpoint = didDocument.service?.find(
      (service) => service.id === `${parsedDid.did}#${queriedService}`
    )?.serviceEndpoint

    if (!baseEndpoint) {
      throw new Error(`No valid endpoint has been found for the service ${queriedService}`)
    }

    const fetchResourceUrl = `${baseEndpoint}${relativeRef}`
    agentContext.config.logger.debug(`getting AnonCreds resource at URL: ${fetchResourceUrl}`)
    return {
      response: await agentContext.config.agentDependencies.fetch(fetchResourceUrl, { method: 'GET' }),
      resourceId,
    }
  }
}
