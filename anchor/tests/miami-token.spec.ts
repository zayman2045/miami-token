import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { MiamiToken } from "../target/types/miami_token";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

describe("Miami Token", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const connection = provider.connection;
  const payer = provider.wallet as anchor.Wallet;

  const program = anchor.workspace.MiamiToken as Program<MiamiToken>;

  const [miamiTokenMint] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("mint")],
    program.programId
  );

  const user = Keypair.generate();

  it("Initialize Miami Token", async () => {
    // Create the token mint
    const tx = await program.methods
      .createTokenMint()
      .accounts({
        signer: payer.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc({ skipPreflight: true, commitment: "confirmed" });

    console.log("Token mint initialization successful: ", tx);
  
    // Check that the token mint was created
    const mintAccount = await connection.getParsedAccountInfo(
      miamiTokenMint
    );

    const parsedInfo = (mintAccount.value?.data as any).parsed?.info;   

    expect(parsedInfo.isInitialized).toBe(true);

  });

  it("Airdrop tokens to user", async () => {
    // Fund the user with 2 SOL
    const airdropSolSignature = await provider.connection.requestAirdrop(
      user.publicKey,
      2 * LAMPORTS_PER_SOL
    );

    const latestBlockHash = await provider.connection.getLatestBlockhash();

    await provider.connection.confirmTransaction({
      blockhash: latestBlockHash.blockhash,
      lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
      signature: airdropSolSignature,
    }, "confirmed");

    const airdropAmount = new anchor.BN(100);

    const tx = await program.methods
      .airdropTokens(airdropAmount)
      .accounts({
        user: user.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([user])
      .rpc({ skipPreflight: false, commitment: "confirmed" });

    console.log("Airdrop successful: ", tx);
  });
});
