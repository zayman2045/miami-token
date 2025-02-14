import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Keypair } from "@solana/web3.js";
import { MiamiToken } from "../target/types/miami_token";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

describe("Miami Token", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const payer = provider.wallet as anchor.Wallet;

  const program = anchor.workspace.MiamiToken as Program<MiamiToken>;

  // const miamiTokenKMint = Keypair.generate();
  const [miamiTokenKMint] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("mint")],
    program.programId
  );

  console.log("Miami token mint: ", miamiTokenKMint.toBase58());

  it("Initialize Miami Token", async () => {
    const tx = await program.methods
      .createTokenMint()
      .accounts({
        signer: payer.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc({ skipPreflight: true, commitment: "confirmed" });

    console.log("Your transaction signature", tx);
  });
});
