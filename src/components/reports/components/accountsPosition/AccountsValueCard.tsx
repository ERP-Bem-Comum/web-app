import { maskMonetaryValue } from '@/utils/masks'
import { Grid } from '@mui/material'

export enum ColorsAccountsValueCard {
  red = '#FF3B30',
  green = '#34C759',
  orange = '#FF9500',
  blue = '#155366',
}

interface AccountsValueCardProps {
  title: string
  value?: number
  color: keyof typeof ColorsAccountsValueCard
  size?: number
}

const AccountsValueCard = ({ title, value, color, size = 12 / 4 }: AccountsValueCardProps) => {
  return (
    <Grid
      item
      xs={size}
      display={'flex'}
      flexDirection={'column'}
      alignItems={'center'}
      paddingBottom={5}
      rowGap={5}
    >
      <label
        style={{
          color: ColorsAccountsValueCard.blue,
          fontSize: 20,
        }}
      >
        {title}
      </label>
      <label
        style={{
          color: ColorsAccountsValueCard[color],
          fontSize: 20,
          fontWeight: 'bolder',
        }}
      >
        Total: {maskMonetaryValue(value ?? 0)}
      </label>
    </Grid>
  )
}

export default AccountsValueCard
