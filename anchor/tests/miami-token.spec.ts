import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { MiamiToken } from "../target/types/miami_token";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

describe("Miami Token", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const connection = provider.connection;
  const payer = provider.wallet as anchor.Wallet;

  const program = anchor.workspace.MiamiToken as Program<MiamiToken>;

  let tokenMintKeypair: Keypair;

  beforeAll(async () => {
    // Create a new keypair for the token mint
    tokenMintKeypair = anchor.web3.Keypair.generate();
    console.log("Token Mint Keypair: ", tokenMintKeypair.publicKey.toBase58());
  });

// Initialize token mint and token mint state
  it("Initialize token", async () => {
    // Create the token mint
    const tx = await program.methods
      .createTokenMint()
      .accounts({
        signer: payer.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        tokenMint: tokenMintKeypair.publicKey,
      })
      .signers([tokenMintKeypair])
      .rpc({ skipPreflight: true, commitment: "confirmed" });

    console.log("Token mint initialization successful: ", tx);

    // Check that the token mint state is mint authority for the token mint account
    const [tokenMintStateAccountAddress] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("mint_state"), tokenMintKeypair.publicKey.toBuffer()],
        program.programId
      );

    const mintAccountInfo = await connection.getParsedAccountInfo(
      tokenMintKeypair.publicKey
    );

    const parsedInfo = (mintAccountInfo.value?.data as any).parsed?.info;

    expect(parsedInfo.mintAuthority as string).toBe(
      tokenMintStateAccountAddress.toBase58()
    );

    // Check that the token mint state contains the correct token mint address
    const tokenMintStateAccount = await program.account.tokenMintState.fetch(
      tokenMintStateAccountAddress
    );
    expect(tokenMintStateAccount.mint.toBase58()).toBe(tokenMintKeypair.publicKey.toBase58());
  });

  // it("Airdrop tokens to user", async () => {
  //   // Create a user and fund their account with 2 SOL
  //   const user = Keypair.generate();

  //   const airdropSolSignature = await provider.connection.requestAirdrop(
  //     user.publicKey,
  //     2 * LAMPORTS_PER_SOL
  //   );

  //   const latestBlockHash = await provider.connection.getLatestBlockhash();

  //   await provider.connection.confirmTransaction(
  //     {
  //       blockhash: latestBlockHash.blockhash,
  //       lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
  //       signature: airdropSolSignature,
  //     },
  //     "confirmed"
  //   );

  //   const airdropAmount = new anchor.BN(100);

  //   const tx = await program.methods
  //     .airdropTokens(airdropAmount)
  //     .accounts({
  //       user: user.publicKey,
  //       tokenProgram: TOKEN_PROGRAM_ID,
  //     })
  //     .signers([user])
  //     .rpc({ skipPreflight: false, commitment: "confirmed" });

  //   console.log("Airdrop successful: ", tx);
  // });
});
