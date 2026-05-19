import { BankReconciliationType } from '@/enums/reconciliation'
import Radio from '@mui/material/Radio'

export default function RadioButtons({
  id,
  radio,
  setRadio,
  disabled = false,
  amount,
}: {
  id: string
  radio: BankReconciliationType
  setRadio: React.Dispatch<React.SetStateAction<BankReconciliationType>>
  disabled?: boolean
  amount: number
}) {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRadio(event.target.value as BankReconciliationType)
  }

  const uniqueIdFind = 'find' + id
  const uniqueIdTransfer = 'transfer' + id
  const uniqueIdFee = 'fee' + id
  const uniqueIdProfit = 'profit' + id

  return (
    <div className="flex items-center mb-1">
      <fieldset>
        <Radio
          size="small"
          id={uniqueIdFind}
          checked={radio === BankReconciliationType.TRANSACTION_ENTRY}
          onChange={handleChange}
          value={BankReconciliationType.TRANSACTION_ENTRY}
          name="radio-buttons"
          inputProps={{
            'aria-label': uniqueIdFind,
          }}
          disabled={disabled}
        />
        <label htmlFor={uniqueIdFind} className="text-sm">
          Buscar
        </label>
      </fieldset>

      <fieldset>
        <Radio
          size="small"
          id={uniqueIdTransfer}
          checked={radio === BankReconciliationType.TRANSFER}
          onChange={handleChange}
          value={BankReconciliationType.TRANSFER}
          name="radio-buttons"
          inputProps={{ 'aria-label': uniqueIdTransfer }}
          disabled={disabled}
        />
        <label htmlFor={uniqueIdTransfer} className="text-sm">
          Transferência
        </label>
      </fieldset>

      {amount < 0 && (
        <fieldset>
          <Radio
            size="small"
            id={uniqueIdFee}
            checked={radio === BankReconciliationType.TAX}
            onChange={handleChange}
            value={BankReconciliationType.TAX}
            name="radio-buttons"
            inputProps={{ 'aria-label': uniqueIdFee }}
            disabled={disabled}
          />
          <label htmlFor={uniqueIdFee} className="text-sm">
            Taxa
          </label>
        </fieldset>
      )}

      {amount >= 0 && (
        <fieldset>
          <Radio
            size="small"
            id={uniqueIdProfit}
            checked={radio === BankReconciliationType.PROFIT}
            onChange={handleChange}
            value={BankReconciliationType.PROFIT}
            name="radio-buttons"
            inputProps={{ 'aria-label': uniqueIdProfit }}
            disabled={disabled}
          />
          <label htmlFor={uniqueIdProfit} className="text-sm">
            Lucro
          </label>
        </fieldset>
      )}
    </div>
  )
}
