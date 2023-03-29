import { TypedArrayEncoder, Hasher } from '@aries-framework/core'
import canonicalize from 'canonicalize'

export function calculateObjectId(objectValue: unknown) {
  const objectString = canonicalize(objectValue)

  if (!objectString) {
    throw new Error('Cannot canonicalize object')
  }

  return TypedArrayEncoder.toBase58(Hasher.hash(TypedArrayEncoder.fromString(objectString), 'sha2-256'))
}

export function verifyObjectId(objectValue: unknown, objectId: string) {
  return calculateObjectId(objectValue) === objectId
}
