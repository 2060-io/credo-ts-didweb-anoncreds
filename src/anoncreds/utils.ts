import { TypedArrayEncoder, Hasher } from '@credo-ts/core'
import canonicalize from 'canonicalize'

export function calculateResourceId(resourceObjectValue: unknown) {
  const objectString = canonicalize(resourceObjectValue)

  if (!objectString) {
    throw new Error('Cannot canonicalize resource object')
  }

  return TypedArrayEncoder.toBase58(Hasher.hash(TypedArrayEncoder.fromString(objectString), 'sha2-256'))
}

export function verifyResourceId(resourceObjectValue: unknown, resourceId: string) {
  return calculateResourceId(resourceObjectValue) === resourceId
}
