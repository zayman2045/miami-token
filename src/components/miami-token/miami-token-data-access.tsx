// This file is used to interact with the miami token program on Solana
"use client";

import { getMiamiTokenProgram, getMiamiTokenProgramId } from "@project/anchor";
import { useConnection } from "@solana/wallet-adapter-react";
import { Cluster, Keypair, PublicKey } from "@solana/web3.js";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import toast from "react-hot-toast";
import { useCluster } from "../cluster/cluster-data-access";
import { useAnchorProvider } from "../solana/solana-provider";
import { useTransactionToast } from "../ui/ui-layout";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { BN } from "@coral-xyz/anchor";

// Hook to query and initialize the miami token program
export function useMiamiTokenProgram() {
  const { connection } = useConnection();
  const { cluster } = useCluster();
  const transactionToast = useTransactionToast();
  const provider = useAnchorProvider();

  // Get the program ID and program instance
  const programId = useMemo(
    () => getMiamiTokenProgramId(cluster.network as Cluster),
    [cluster]
  );
  const program = useMemo(
    () => getMiamiTokenProgram(provider, programId),
    [provider, programId]
  );

  // Query to fetch all miami token program accounts
  const accounts = useQuery({
    queryKey: ["miami_token", "all", { cluster }],
    queryFn: () => program.account.tokenMintState.all(),
  });

  // Query to fetch the program account using the program ID
  const getProgramAccount = useQuery({
    queryKey: ["get-program-account", { cluster }],
    queryFn: () => connection.getParsedAccountInfo(programId),
  });

  // Mutation to create a new miami token mint account
  const createTokenMint = useMutation({
    mutationKey: ["miami_token", "create_token_mint", { cluster }],
    mutationFn: (tokenMint: Keypair) =>
      program.methods
        .createTokenMint()
        .accounts({
          tokenMint: tokenMint.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([tokenMint])
        .rpc(),
    onSuccess: (signature) => {
      transactionToast(signature);
      return accounts.refetch();
    },
    onError: () => toast.error("Failed to create token mint"),
  });

  return {
    program,
    programId,
    accounts,
    getProgramAccount,
    createTokenMint,
  };
}

// Hook to query and increment the miami token program account
export function useMiamiTokenProgramAccount({
  account,
}: {
  account: PublicKey;
}) {
  const { connection } = useConnection();
  const { cluster } = useCluster();
  const transactionToast = useTransactionToast();
  const { program, accounts } = useMiamiTokenProgram();

  // Query to fetch the token mint state account
  const tokenMintStateAccountQuery = useQuery({
    queryKey: ["miami_token_state", "fetch", { cluster, account }],
    queryFn: () => program.account.tokenMintState.fetch(account),
  });

  // Query to fetch the token mint account
  const tokenMintAccountQuery = useQuery({
    queryKey: ["miami_token_mint", "fetch", { cluster, account }],
    queryFn: () => connection.getParsedAccountInfo(account) // todo: pass in mint account address
  });

  //TODO:  Query to fetch the associated token account
  // const associatedTokenAccountQuery = useQuery({
  //   queryKey: ["miami_token_associated_token", "fetch", { cluster, account }],
  //   queryFn: () => connection.getParsedAccountInfo(account),
  // });

  // Mutation to airdrop tokens to the user
  const airdropTokensMutation = useMutation({
    mutationKey: ["miami_token", "airdrop_tokens", { cluster, account }],
    mutationFn: () =>
      program.methods
        .airdropTokens(new BN(100)) 
        .accounts({
          tokenMint: account,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc(),
    onSuccess: (tx) => {
      transactionToast(tx);
      return tokenMintStateAccountQuery.refetch();
    },
  });

  return {
    tokenMintAccountQuery,
    tokenMintStateAccountQuery,
    airdropTokensMutation,
  };
}
