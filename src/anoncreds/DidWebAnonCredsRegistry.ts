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
import { AgentContext, utils } from '@aries-framework/core'

const DIDURLREGEXP = /^did:web:([_a-z0-9.%A-]*)\/([_a-z0-9-/]*)/

export class DidWebAnonCredsRegistry implements AnonCredsRegistry {
  public readonly supportedIdentifier = /^did:web:[_a-z0-9.%A-]*/

  public async getSchema(agentContext: AgentContext, schemaId: string): Promise<GetSchemaReturn> {
    const match = schemaId.match(DIDURLREGEXP)

    if (match) {
      const [, domain, path] = match

      agentContext.config.logger.debug(
        `getting schema from URL: https://${domain.replace('%3A', ':')}/.well-known/${path}`
      )
      const response = await agentContext.config.agentDependencies.fetch(
        `https://${domain.replace('%3A', ':')}/.well-known/${path}`
      )

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
    } else {
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
    const schemaId = `${options.schema.issuerId}/anoncreds/v1/schemas/${utils.uuid()}`

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
    const match = credentialDefinitionId.match(DIDURLREGEXP)

    if (match) {
      const [, domain, path] = match

      agentContext.config.logger.debug(
        `getting credential definition from URL: https://${domain.replace('%3A', ':')}/.well-known/${path}`
      )
      const response = await agentContext.config.agentDependencies.fetch(
        `https://${domain.replace('%3A', ':')}/.well-known/${path}`
      )

      if (response.status === 200) {
        return {
          credentialDefinitionId,
          credentialDefinition: (await response.json()) as AnonCredsCredentialDefinition,
          credentialDefinitionMetadata: {},
          resolutionMetadata: {},
        }
      } else {
        return {
          resolutionMetadata: { error: 'notFound' },
          credentialDefinitionMetadata: {},
          credentialDefinitionId,
        }
      }
    } else {
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
    }/anoncreds/v1/credential-definitions/${utils.uuid()}`

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
