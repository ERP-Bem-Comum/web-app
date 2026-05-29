import { Box } from '@mui/material'
import { ReactNode } from 'react'

interface SearchContainerProps {
  children: ReactNode
}

const SearchContainer = ({ children }: SearchContainerProps) => {
  return (
    <Box sx={{ width: '100%', height: '100%', padding: 4, bgcolor: 'white', overflowY: 'scroll' }}>
      {children}
    </Box>
  )
}

export default SearchContainer
