// Here we export some useful types and functions for interacting with the Anchor program.
import { AnchorProvider, Program } from '@coral-xyz/anchor'
import { Cluster, PublicKey } from '@solana/web3.js'
import MiamiTokenIDL from '../target/idl/miami_token.json'
import type { MiamiToken } from '../target/types/miami_token'

// Re-export the generated IDL and type
export { MiamiToken, MiamiTokenIDL }

// The programId is imported from the program IDL.
export const MIAMI_TOKEN_PROGRAM_ID = new PublicKey(MiamiTokenIDL.address)

// This is a helper function to get the MiamiToken Anchor program.
export function getMiamiTokenProgram(provider: AnchorProvider, address?: PublicKey) {
  return new Program({ ...MiamiTokenIDL, address: address ? address.toBase58() : MiamiTokenIDL.address } as MiamiToken, provider)
}

// This is a helper function to get the program ID for the MiamiToken program depending on the cluster.
export function getMiamiTokenProgramId(cluster: Cluster) {
  switch (cluster) {
    case 'devnet':
    case 'testnet':
      // This is the program ID for the MiamiToken program on devnet and testnet.
      return new PublicKey('coUnmi3oBUtwtd9fjeAvSsJssXh5A5xyPbhpewyzRVF')
    case 'mainnet-beta':
    default:
      return MIAMI_TOKEN_PROGRAM_ID
  }
}
