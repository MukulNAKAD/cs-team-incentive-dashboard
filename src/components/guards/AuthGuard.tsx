import { ReactNode, useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

interface AuthGuardProps {
  children: ReactNode
  isAuthenticated: boolean
}

const AuthGuard = ({ children, isAuthenticated }: AuthGuardProps) => {
  const location = useLocation()

  useEffect(() => {
    // You can add additional checks here (like token expiry)
  }, [])

  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    return <Navigate to="/auth/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}

export default AuthGuard
