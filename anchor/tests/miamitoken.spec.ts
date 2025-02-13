import * as anchor from '@coral-xyz/anchor'
import {Program} from '@coral-xyz/anchor'
import {Keypair} from '@solana/web3.js'
import {Miamitoken} from '../target/types/miamitoken'

describe('miamitoken', () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider)
  const payer = provider.wallet as anchor.Wallet

  const program = anchor.workspace.Miamitoken as Program<Miamitoken>

  const miamitokenKeypair = Keypair.generate()

  it('Initialize Miamitoken', async () => {
    await program.methods
      .initialize()
      .accounts({
        miamitoken: miamitokenKeypair.publicKey,
        payer: payer.publicKey,
      })
      .signers([miamitokenKeypair])
      .rpc()

    const currentCount = await program.account.miamitoken.fetch(miamitokenKeypair.publicKey)

    expect(currentCount.count).toEqual(0)
  })

  it('Increment Miamitoken', async () => {
    await program.methods.increment().accounts({ miamitoken: miamitokenKeypair.publicKey }).rpc()

    const currentCount = await program.account.miamitoken.fetch(miamitokenKeypair.publicKey)

    expect(currentCount.count).toEqual(1)
  })

  it('Increment Miamitoken Again', async () => {
    await program.methods.increment().accounts({ miamitoken: miamitokenKeypair.publicKey }).rpc()

    const currentCount = await program.account.miamitoken.fetch(miamitokenKeypair.publicKey)

    expect(currentCount.count).toEqual(2)
  })

  it('Decrement Miamitoken', async () => {
    await program.methods.decrement().accounts({ miamitoken: miamitokenKeypair.publicKey }).rpc()

    const currentCount = await program.account.miamitoken.fetch(miamitokenKeypair.publicKey)

    expect(currentCount.count).toEqual(1)
  })

  it('Set miamitoken value', async () => {
    await program.methods.set(42).accounts({ miamitoken: miamitokenKeypair.publicKey }).rpc()

    const currentCount = await program.account.miamitoken.fetch(miamitokenKeypair.publicKey)

    expect(currentCount.count).toEqual(42)
  })

  it('Set close the miamitoken account', async () => {
    await program.methods
      .close()
      .accounts({
        payer: payer.publicKey,
        miamitoken: miamitokenKeypair.publicKey,
      })
      .rpc()

    // The account should no longer exist, returning null.
    const userAccount = await program.account.miamitoken.fetchNullable(miamitokenKeypair.publicKey)
    expect(userAccount).toBeNull()
  })
})
