'use client'
import FormContract from '@/components/contracts/FormContracts'
import { localDbGetContractById } from '@/mocks/localDb'
import { IContract } from '@/types/contracts'
import { useEffect, useState } from 'react'

export default function AddContract() {
  const [draftContract, setDraftContract] = useState<IContract | undefined>()

  useEffect(() => {
    const raw = typeof window !== 'undefined' ? sessionStorage.getItem('contract_draft_id') : null
    if (raw) {
      const draft = localDbGetContractById(Number(raw))
      if (draft) setDraftContract(draft as unknown as IContract)
    }
  }, [])

  return <FormContract edit={true} layout="launch" contract={draftContract} />
}
