// This file is used to interact with the miami token program on Solana
'use client'

import { getMiamiTokenProgram, getMiamiTokenProgramId } from '@project/anchor'
import { useConnection } from '@solana/wallet-adapter-react'
import { Cluster, Keypair, PublicKey } from '@solana/web3.js'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import toast from 'react-hot-toast'
import { useCluster } from '../cluster/cluster-data-access'
import { useAnchorProvider } from '../solana/solana-provider'
import { useTransactionToast } from '../ui/ui-layout'

// Hook to query and initialize the miami token program
export function useMiamiTokenProgram() {
  const { connection } = useConnection()
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const provider = useAnchorProvider()
  const programId = useMemo(() => getMiamiTokenProgramId(cluster.network as Cluster), [cluster])
  const program = useMemo(() => getMiamiTokenProgram(provider, programId), [provider, programId])

  // Query to fetch all miami token program accounts
  const accounts = useQuery({
    queryKey: ['miami_token', 'all', { cluster }],
    queryFn: () => program.account.miami_token.all(),
  })

  // Query to fetch the program account
  const getProgramAccount = useQuery({
    queryKey: ['get-program-account', { cluster }],
    queryFn: () => connection.getParsedAccountInfo(programId),
  })

  // Mutation to initialize a new miami token program account
  const initialize = useMutation({
    mutationKey: ['miamitoken', 'initialize', { cluster }],
    mutationFn: (keypair: Keypair) =>
      program.methods.initialize().accounts({ miamitoken: keypair.publicKey }).signers([keypair]).rpc(),
    onSuccess: (signature) => {
      transactionToast(signature)
      return accounts.refetch()
    },
    onError: () => toast.error('Failed to initialize account'),
  })

  return {
    program,
    programId,
    accounts,
    getProgramAccount,
    initialize,
  }
}

// Hook to query and increment the miami token program account
export function useMiamiTokenProgramAccount({ account }: { account: PublicKey }) {
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const { program, accounts } = useMiamiTokenProgram()

  const accountQuery = useQuery({
    queryKey: ['miami_token', 'fetch', { cluster, account }],
    queryFn: () => program.account.miami_token.fetch(account),
  })

  const incrementMutation = useMutation({
    mutationKey: ['miamitoken', 'increment', { cluster, account }],
    mutationFn: () => program.methods.increment().accounts({ miamitoken: account }).rpc(),
    onSuccess: (tx) => {
      transactionToast(tx)
      return accountQuery.refetch()
    },
  })

  return {
    accountQuery,
    incrementMutation,
  }
}
