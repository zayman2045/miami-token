"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletButton } from "../solana/solana-provider";
import { AppHero, ellipsify } from "../ui/ui-layout";
import { ExplorerLink } from "../cluster/cluster-ui";
import { useMiamiTokenProgram } from "./miami-token-data-access";
import { MiamiTokenCreate, MiamiTokenList } from "./miami-token-ui";

export default function MiamiTokenFeature() {
  const { publicKey } = useWallet();
  const { programId } = useMiamiTokenProgram();

  return publicKey ? (
    <div>
      <AppHero
        title="Miami Token"
        subtitle={
          'Create a new account by clicking the "Create" button. The state of a account is stored on-chain and can be manipulated by calling the program\'s methods.'
        }
      >
        <p className="mb-6">
          <ExplorerLink
            path={`account/${programId}`}
            label={ellipsify(programId.toString())}
          />
        </p>
        <MiamiTokenCreate />
      </AppHero>
      <MiamiTokenList />
    </div>
  ) : (
    <div className="max-w-4xl mx-auto">
      <div className="hero py-[64px]">
        <div className="hero-content text-center">
          <WalletButton />
        </div>
      </div>
    </div>
  );
}
