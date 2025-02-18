"use client";

import { Keypair, PublicKey } from "@solana/web3.js";
import { useMemo } from "react";
import { ellipsify } from "../ui/ui-layout";
import { ExplorerLink } from "../cluster/cluster-ui";
import {
  useMiamiTokenProgram,
  useMiamiTokenProgramAccount,
} from "./miami-token-data-access";

// Button to create a new token mint account
export function MiamiTokenCreate() {
  const { createTokenMint } = useMiamiTokenProgram();

  return (
    <button
      className="btn btn-xs lg:btn-md btn-primary"
      onClick={() => createTokenMint.mutateAsync(Keypair.generate())}
      disabled={createTokenMint.isPending}
    >
      Create Token Mint {createTokenMint.isPending && "..."}
    </button>
  );
}

// List of all token mint accounts
export function MiamiTokenList() {
  const { programAccounts, getProgramAccount } = useMiamiTokenProgram();

  if (getProgramAccount.isLoading) {
    return <span className="loading loading-spinner loading-lg"></span>;
  }
  if (!getProgramAccount.data?.value) {
    return (
      <div className="alert alert-info flex justify-center">
        <span>
          Program account not found. Make sure you have deployed the program and
          are on the correct cluster.
        </span>
      </div>
    );
  }
  return (
    <div className={"space-y-6"}>
      {programAccounts.isLoading ? (
        <span className="loading loading-spinner loading-lg"></span>
      ) : programAccounts.data?.length ? (
        <div className="grid md:grid-cols-2 gap-4">
          {programAccounts.data?.map((programAccount) => (
            <MiamiTokenCard
              key={programAccount.publicKey.toString()}
              programAccount={programAccount.publicKey}
            />
          ))}
        </div>
      ) : (
        <div className="text-center">
          <h2 className={"text-2xl"}>No accounts</h2>
          No accounts found. Create one above to get started.
        </div>
      )}
    </div>
  );
}

function MiamiTokenCard({ programAccount }: { programAccount: PublicKey }) {
  const {
    tokenMintStateAccountQuery,
    airdropTokensMutation,
    mintAccount,
    associatedTokenAccountBalanceQuery,
  } = useMiamiTokenProgramAccount({
    programAccount,
  });

  // Get the token supply from the token mint state account
  const tokenSupply = useMemo(
    () => tokenMintStateAccountQuery.data?.supply ?? 0,
    [tokenMintStateAccountQuery.data?.supply]
  ).toString();

  // Get the token account balance from the associated token account
  const [tokenAccountAddress, tokenAccountBalance] = useMemo(
    () => associatedTokenAccountBalanceQuery.data ?? ["Uninitialized", "0"],
    [associatedTokenAccountBalanceQuery.data]
  );

  return tokenMintStateAccountQuery.isLoading ? (
    <span className="loading loading-spinner loading-lg"></span>
  ) : (
    <div className="card card-bordered border-base-300 border-4 text-neutral-content">
      <div className="card-body items-center text-center">
        <div className="space-y-6">
          <h2
            className="card-title justify-center text-3xl cursor-pointer"
            onClick={() => tokenMintStateAccountQuery.refetch()}
          ></h2>
          <div>
            <p>Token Supply: {tokenSupply}</p>
            <p>My Balance: {tokenAccountBalance}</p>
          </div>
          <div className="card-actions justify-around">
            <button
              className="btn btn-xs lg:btn-md btn-outline"
              onClick={() => airdropTokensMutation.mutateAsync()}
              disabled={airdropTokensMutation.isPending}
            >
              Mint 100 Tokens
            </button>
          </div>
          <div className="text-center space-y-4">
            <p>
              Program:
              <ExplorerLink
                path={`account/${programAccount}`}
                label={ellipsify(programAccount.toString())}
              />
            </p>
            <p>
              Mint:{" "}
              <ExplorerLink
                path={`account/${mintAccount}`}
                label={ellipsify(mintAccount.toString())}
              />
            </p>
            <p>
              Token Account:{" "}
              <ExplorerLink
                path={`account/${tokenAccountAddress}`}
                label={ellipsify(tokenAccountAddress)}
              />
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
