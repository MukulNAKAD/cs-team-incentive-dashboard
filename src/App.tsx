import { CssBaseline, Box } from '@mui/material'
import { useRoutes } from 'react-router-dom'
import { useTheme } from './contexts/ThemeContext'
import { useAuth } from './contexts/AuthContext'
import routes from './routes'

const App = () => {
  const { theme } = useTheme()
  const { isAuthenticated } = useAuth()
  const routing = useRoutes(routes(isAuthenticated))

  return (
    <Box
      sx={{
        bgcolor: 'background.default',
        color: 'text.primary',
        minHeight: '100vh',
      }}
    >
      <CssBaseline />
      {routing}
    </Box>
  )
}

export default App
