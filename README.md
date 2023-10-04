# Aries JavaScript did:web AnonCreds

AnonCreds did:web method registry for [aries-framework-javascript](https://github.com/hyperledger/aries-framework-javascript).

Based on current draft spec being written in this [repo](https://github.com/2060-io/did-web-anoncreds-method).

## Usage

In order to plug-in this into an AFJ Agent instance (from 0.4.0 onwards) you must register `DidWebAnonCredsRegistry` into the `AnonCredsModule` configuration:

```ts
import { DidWebAnonCredsRegistry } from 'aries-javascript-didweb-anoncreds'

const agent = new Agent({
  config: {
    /* agent config */
  },
  dependencies,
  modules: {
    /* ... */
    anoncreds: new AnonCredsModule({ registries: [
        /* ... */
      new DidWebAnonCredsRegistry()
    ] }),
})
```
