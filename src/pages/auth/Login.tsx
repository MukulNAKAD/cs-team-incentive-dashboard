import { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  OutlinedInput,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress,
  Container,
  Paper,
  useTheme,
} from '@mui/material'
import { Visibility, VisibilityOff } from '@mui/icons-material'
import { useAuth } from '../../contexts/AuthContext'

const Login = () => {
  const theme = useTheme()
  const { login, error, isLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword)
  }

  const validateInputs = (): boolean => {
    let isValid = true

    if (!email) {
      setEmailError('Email is required')
      isValid = false
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Please enter a valid email address')
      isValid = false
    } else {
      setEmailError('')
    }

    if (!password) {
      setPasswordError('Password is required')
      isValid = false
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters')
      isValid = false
    } else {
      setPasswordError('')
    }

    return isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (validateInputs()) {
      await login(email, password)
    }
  }

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
        }}
      >
        <Paper 
          elevation={3}
          sx={{
            width: '100%',
            p: 4,
            borderRadius: 2,
            bgcolor: theme.palette.background.paper,
          }}
        >
          <Box 
            sx={{ 
              mb: 3, 
              textAlign: 'center',
            }}
          >
            <Typography variant="h4" color="primary" gutterBottom>
              CS Team Incentive Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Sign in to your account
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email"
              variant="outlined"
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={!!emailError}
              helperText={emailError}
              disabled={isLoading}
              autoFocus
            />

            <FormControl fullWidth variant="outlined" margin="normal" error={!!passwordError}>
              <InputLabel htmlFor="password">Password</InputLabel>
              <OutlinedInput
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowPassword}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                }
                label="Password"
              />
              {passwordError && (
                <Typography variant="caption" color="error">
                  {passwordError}
                </Typography>
              )}
            </FormControl>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              disabled={isLoading}
              sx={{ mt: 3, mb: 2, py: 1.5 }}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Sign In'}
            </Button>
          </form>
        </Paper>
        
        <Typography variant="body2" color="text.secondary" sx={{ mt: 4 }}>
          © {new Date().getFullYear()} CS Team Incentive Dashboard Tracker
        </Typography>
      </Box>
    </Container>
  )
}

export default Login
