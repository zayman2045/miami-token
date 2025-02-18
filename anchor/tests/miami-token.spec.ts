import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { MiamiToken } from "../target/types/miami_token";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from "@solana/spl-token";

describe("Miami Token", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const connection = provider.connection;
  const payer = provider.wallet as anchor.Wallet;

  const program = anchor.workspace.MiamiToken as Program<MiamiToken>;

  let tokenMint: Keypair;

  beforeAll(async () => {
    // Create a new keypair for the token mint
    tokenMint = anchor.web3.Keypair.generate();
    console.log("Token Mint Keypair: ", tokenMint.publicKey.toBase58());
  });

  // Initialize token mint and token mint state
  it("Initialize token", async () => {
    // Create the token mint
    const tx = await program.methods
      .createTokenMint()
      .accounts({
        signer: payer.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        tokenMint: tokenMint.publicKey,
      })
      .signers([tokenMint])
      .rpc({ skipPreflight: true, commitment: "confirmed" });

    console.log("Token mint initialization successful: ", tx);

    // Check that the token mint state is mint authority for the token mint account
    const [tokenMintStateAccountAddress] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("mint_state"), tokenMint.publicKey.toBuffer()],
        program.programId
      );

    const mintAccountInfo = await connection.getParsedAccountInfo(
      tokenMint.publicKey
    );

    const parsedInfo = (mintAccountInfo.value?.data as any).parsed.info;

    expect(parsedInfo.mintAuthority as string).toBe(
      tokenMintStateAccountAddress.toBase58()
    );

    // Check that the token mint state contains the correct token mint address
    const tokenMintStateAccount = await program.account.tokenMintState.fetch(
      tokenMintStateAccountAddress
    );
    expect(tokenMintStateAccount.mint.toBase58()).toBe(
      tokenMint.publicKey.toBase58()
    );
  });

  it("Airdrop tokens to user", async () => {
    // Create a user and fund their account with 2 SOL
    const user = Keypair.generate();

    const solAirdropSolSignature = await provider.connection.requestAirdrop(
      user.publicKey,
      2 * LAMPORTS_PER_SOL
    );

    // Wait for the SOL airdrop to be confirmed
    const latestBlockHash = await provider.connection.getLatestBlockhash();

    await provider.connection.confirmTransaction(
      {
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature: solAirdropSolSignature,
      },
      "confirmed"
    );

    // Airdrop SPL tokens to the user
    const tokenAirdropAmount = new anchor.BN(100);

    const tx = await program.methods
      .airdropTokens(tokenAirdropAmount)
      .accounts({
        user: user.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        tokenMint: tokenMint.publicKey,
      })
      .signers([user])
      .rpc({ skipPreflight: true, commitment: "confirmed" });

    console.log("Airdrop successful: ", tx);

    // Check the user's token balance
    const associatedTokenAccount = await getAssociatedTokenAddress(
      tokenMint.publicKey,
      user.publicKey
    );
    
    const userTokenAccountInfo = await connection.getParsedAccountInfo(
      associatedTokenAccount
    );

    const tokenAmount = (userTokenAccountInfo.value?.data as any).parsed.info.tokenAmount.amount;

    expect(tokenAmount.toString()).toBe(
      tokenAirdropAmount.toString()
    );

  });
});
