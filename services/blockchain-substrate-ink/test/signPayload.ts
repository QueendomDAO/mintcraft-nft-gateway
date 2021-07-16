import type { KeyringPair } from '@polkadot/keyring/types'

import { Keyring } from '@polkadot/keyring'
import { assert, hexToU8a, isHex, u8aToHex } from '@polkadot/util'
import { cryptoWaitReady, keyExtractSuri, mnemonicValidate } from '@polkadot/util-crypto'

type Curves = 'ed25519' | 'sr25519'

const SEED_LENGTHS = [12, 15, 18, 21, 24]

/**
 * Seed here can be any of the following:
 *  - mnemonic (with/without derivation path): <mnemonic>[//<hard>/<soft>///<password>]
 *  - hex seed (with/without derivation path): <hex>[//<hard>/<soft>///<password>]
 */
function validateSeed (suri: string): void {
  const { phrase } = keyExtractSuri(suri)

  if (isHex(phrase)) {
    assert(isHex(phrase, 256), 'Hex seed needs to be 256-bits')
  } else {
    // sadly isHex detects as string, so we need a cast here
    assert(SEED_LENGTHS.includes((phrase as string).split(' ').length), `Mnemonic needs to contain ${SEED_LENGTHS.join(', ')} words`)
    assert(mnemonicValidate(phrase), 'Not a valid mnemonic seed')
  }
}

function validatePayload (payload: string): void {
  assert(payload.length > 0, 'Cannot sign empty payload. Please check your input and try again.')
  assert(isHex(payload), 'Payload must be supplied as a hex string. Please check your input and try again.')
}

function createSignature (pair: KeyringPair, payload: string): void {
  validatePayload(payload)

  const signature = pair.sign(hexToU8a(payload), { withType: true })

  console.log(`Signature: ${u8aToHex(signature)}`)
}

export default async function signPayload (suri: string, type: Curves, payload: string): Promise<void> {
  validateSeed(suri)

  await cryptoWaitReady()

  const keyring = new Keyring({ type })
  const pair = keyring.createFromUri(suri)

  createSignature(pair, payload.trim())

  process.exit(0)
}