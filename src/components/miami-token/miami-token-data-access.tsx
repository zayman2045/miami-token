// This file is used to interact with the miami token program on Solana
"use client";

import { getMiamiTokenProgram, getMiamiTokenProgramId } from "@project/anchor";
import { useConnection } from "@solana/wallet-adapter-react";
import {
  Cluster,
  Keypair,
  ParsedAccountData,
  PublicKey,
} from "@solana/web3.js";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import toast from "react-hot-toast";
import { useCluster } from "../cluster/cluster-data-access";
import { useAnchorProvider } from "../solana/solana-provider";
import { useTransactionToast } from "../ui/ui-layout";
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { BN } from "@coral-xyz/anchor";
import { useWallet } from "@solana/wallet-adapter-react";

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
  const programAccounts = useQuery({
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
      return programAccounts.refetch();
    },
    onError: () => toast.error("Failed to create token mint"),
  });

  return {
    program,
    programId,
    programAccounts,
    getProgramAccount,
    createTokenMint,
  };
}

// Hook to query and  the miami token program account
export function useMiamiTokenProgramAccount({
  programAccount,
}: {
  programAccount: PublicKey;
}) {
  const { connection } = useConnection();
  const { cluster } = useCluster();
  const transactionToast = useTransactionToast();
  const { program } = useMiamiTokenProgram();

  // Query to fetch the token mint state account
  const tokenMintStateAccountQuery = useQuery({
    queryKey: ["miami_token_state", "fetch", { cluster, programAccount }],
    queryFn: () => program.account.tokenMintState.fetch(programAccount),
  });

  const mintAccount = tokenMintStateAccountQuery.data?.mint!;
  const userAddress = useWallet().publicKey!;

  // Query to fetch the associated token account
  const associatedTokenAccountBalanceQuery = useQuery({
    queryKey: ["associated_token", "fetch", { cluster, programAccount }],
    queryFn: async () => {
      const associatedTokenAddress = await getAssociatedTokenAddress(
        mintAccount,
        userAddress
      );
      let accountInfo = await connection.getParsedAccountInfo(
        associatedTokenAddress
      );
      let parsedAccountData = accountInfo.value?.data as ParsedAccountData;
      return [associatedTokenAddress.toBase58(), parsedAccountData?.parsed?.info?.tokenAmount?.amount || 0];
    },
    enabled: !!mintAccount && !!userAddress,
  });

  // Query to fetch the 

  // Mutation to airdrop tokens to the user
  const airdropTokensMutation = useMutation({
    mutationKey: ["miami_token", "airdrop_tokens", { cluster, programAccount }],
    mutationFn: () =>
      program.methods
        .airdropTokens(new BN(100))
        .accounts({
          tokenMint: mintAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc(),
    onSuccess: (tx) => {
      transactionToast(tx);
      associatedTokenAccountBalanceQuery.refetch();
      tokenMintStateAccountQuery.refetch();
    },
  });

  return {
    tokenMintStateAccountQuery,
    airdropTokensMutation,
    mintAccount,
    associatedTokenAccountBalanceQuery,
  };
}
