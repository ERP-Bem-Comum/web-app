import { Button, ButtonGroup } from '@mui/material'
import { useState } from 'react'

interface DoubleButtonProps {
  onClickLeft: () => void
  onClickRight: () => void
  labelRight: string
  labelLeft: string
}

const DoubleButton = ({ onClickLeft, onClickRight, labelLeft, labelRight }: DoubleButtonProps) => {
  const [selectedButton, setSelectedButton] = useState(labelLeft)

  const handleLeftClick = () => {
    setSelectedButton(labelLeft)
    onClickLeft()
  }

  const handleRightClick = () => {
    setSelectedButton(labelRight)
    onClickRight()
  }

  return (
    <ButtonGroup variant="outlined" sx={{ height: '40px', width: '100%' }}>
      <Button
        sx={{
          color: '#155366',
          fontWeight: 600,
          bgcolor: selectedButton === labelLeft ? '#BFEDFC !important' : 'transparent !important',
          fontSize: { xs: 13, lg: 14 },
        }}
        onClick={handleLeftClick}
      >
        {labelLeft}
      </Button>
      <Button
        sx={{
          color: '#155366',
          fontWeight: 600,
          backgroundColor:
            selectedButton === labelRight ? '#BFEDFC !important' : 'transparent !important',
          fontSize: { xs: 13, lg: 14 },
        }}
        onClick={handleRightClick}
      >
        {labelRight}
      </Button>
    </ButtonGroup>
  )
}

export default DoubleButton
