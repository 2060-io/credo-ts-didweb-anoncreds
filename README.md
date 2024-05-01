# Credo did:web AnonCreds

AnonCreds did:web method registry for [Credo](https://github.com/openwallet-foundation/credo-ts).

Based on current draft spec being written in this [repo](https://github.com/2060-io/did-web-anoncreds-method).

## Usage

In order to plug-in this into an Credo Agent instance you must register `DidWebAnonCredsRegistry` into the `AnonCredsModule` configuration:

```ts
import { DidWebAnonCredsRegistry } from 'credo-ts-didweb-anoncreds'

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
