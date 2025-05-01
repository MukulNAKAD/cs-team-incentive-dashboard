import { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

interface GuestGuardProps {
  children: ReactNode
  isAuthenticated: boolean
}

const GuestGuard = ({ children, isAuthenticated }: GuestGuardProps) => {
  const location = useLocation()
  const from = location.state?.from?.pathname || '/dashboard'

  if (isAuthenticated) {
    // If already authenticated, redirect to dashboard or previous page
    return <Navigate to={from} replace />
  }

  return <>{children}</>
}

export default GuestGuard
