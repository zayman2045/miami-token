// Here we export some useful types and functions for interacting with the Anchor program.
import { AnchorProvider, Program } from '@coral-xyz/anchor'
import { Cluster, PublicKey } from '@solana/web3.js'
import MiamitokenIDL from '../target/idl/miamitoken.json'
import type { Miamitoken } from '../target/types/miamitoken'

// Re-export the generated IDL and type
export { Miamitoken, MiamitokenIDL }

// The programId is imported from the program IDL.
export const MIAMITOKEN_PROGRAM_ID = new PublicKey(MiamitokenIDL.address)

// This is a helper function to get the Miamitoken Anchor program.
export function getMiamitokenProgram(provider: AnchorProvider, address?: PublicKey) {
  return new Program({ ...MiamitokenIDL, address: address ? address.toBase58() : MiamitokenIDL.address } as Miamitoken, provider)
}

// This is a helper function to get the program ID for the Miamitoken program depending on the cluster.
export function getMiamitokenProgramId(cluster: Cluster) {
  switch (cluster) {
    case 'devnet':
    case 'testnet':
      // This is the program ID for the Miamitoken program on devnet and testnet.
      return new PublicKey('coUnmi3oBUtwtd9fjeAvSsJssXh5A5xyPbhpewyzRVF')
    case 'mainnet-beta':
    default:
      return MIAMITOKEN_PROGRAM_ID
  }
}
