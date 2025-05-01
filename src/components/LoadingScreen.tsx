import { Box, CircularProgress } from '@mui/material'

const LoadingScreen = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        position: 'fixed',
        top: 0,
        left: 0,
        bgcolor: 'background.default',
        zIndex: 9999,
      }}
    >
      <CircularProgress size={60} thickness={4} />
    </Box>
  )
}

export default LoadingScreen
