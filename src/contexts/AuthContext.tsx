import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import jwt_decode from 'jwt-decode'
import { loginUser } from '../api/auth'

type UserType = {
  id: string
  email: string
  role: 'admin' | 'kam' | 'os' | 'rs'
  employee: {
    id: string
    employeeId: string
    name: string
  }
}

type AuthContextType = {
  isAuthenticated: boolean
  user: UserType | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
  error: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [user, setUser] = useState<UserType | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    // Check for existing token on initial load
    const token = localStorage.getItem('token')
    if (token) {
      try {
        // Verify token and set authentication state
        const decodedToken: any = jwt_decode(token)
        
        // Check if token is expired
        const currentTime = Date.now() / 1000
        if (decodedToken.exp < currentTime) {
          // Token is expired
          handleLogout()
        } else {
          // Token is valid
          const userData = JSON.parse(localStorage.getItem('user') || '{}')
          setUser(userData)
          setIsAuthenticated(true)
        }
      } catch (error) {
        // Invalid token
        handleLogout()
      }
    }
  }, [navigate])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await loginUser({ email, password })
      const { token, user } = response
      
      // Store token and user data
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      
      setUser(user)
      setIsAuthenticated(true)
      navigate('/dashboard')
    } catch (error: any) {
      setError(error.message || 'An error occurred during login')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    // Clear token and user data
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    setIsAuthenticated(false)
  }

  const logout = () => {
    handleLogout()
    navigate('/login')
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, isLoading, error }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
