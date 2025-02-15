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

export function useMiamitokenProgram() {
  const { connection } = useConnection()
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const provider = useAnchorProvider()
  const programId = useMemo(() => getMiamiTokenProgramId(cluster.network as Cluster), [cluster])
  const program = useMemo(() => getMiamiTokenProgram(provider, programId), [provider, programId])

  // Fetch all accounts
  const accounts = useQuery({
    queryKey: ['miami_token', 'all', { cluster }],
    queryFn: () => program.account.miami_token.all(),
  })

  // Fetch the program account
  const getProgramAccount = useQuery({
    queryKey: ['get-program-account', { cluster }],
    queryFn: () => connection.getParsedAccountInfo(programId),
  })

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

export function useMiamitokenProgramAccount({ account }: { account: PublicKey }) {
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const { program, accounts } = useMiamitokenProgram()

  const accountQuery = useQuery({
    queryKey: ['miami_token', 'fetch', { cluster, account }],
    queryFn: () => program.account.miami_token.fetch(account),
  })

  const closeMutation = useMutation({
    mutationKey: ['miamitoken', 'close', { cluster, account }],
    mutationFn: () => program.methods.close().accounts({ miamitoken: account }).rpc(),
    onSuccess: (tx) => {
      transactionToast(tx)
      return accounts.refetch()
    },
  })

  const decrementMutation = useMutation({
    mutationKey: ['miamitoken', 'decrement', { cluster, account }],
    mutationFn: () => program.methods.decrement().accounts({ miamitoken: account }).rpc(),
    onSuccess: (tx) => {
      transactionToast(tx)
      return accountQuery.refetch()
    },
  })

  const incrementMutation = useMutation({
    mutationKey: ['miamitoken', 'increment', { cluster, account }],
    mutationFn: () => program.methods.increment().accounts({ miamitoken: account }).rpc(),
    onSuccess: (tx) => {
      transactionToast(tx)
      return accountQuery.refetch()
    },
  })

  const setMutation = useMutation({
    mutationKey: ['miamitoken', 'set', { cluster, account }],
    mutationFn: (value: number) => program.methods.set(value).accounts({ miamitoken: account }).rpc(),
    onSuccess: (tx) => {
      transactionToast(tx)
      return accountQuery.refetch()
    },
  })

  return {
    accountQuery,
    closeMutation,
    decrementMutation,
    incrementMutation,
    setMutation,
  }
}
