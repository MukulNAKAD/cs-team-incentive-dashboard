import { lazy, Suspense } from 'react'
import { Navigate } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import AuthGuard from '../components/guards/AuthGuard'
import GuestGuard from '../components/guards/GuestGuard'
import LoadingScreen from '../components/LoadingScreen'

// Lazy load pages to improve initial load time
const Login = lazy(() => import('../pages/auth/Login'))
const Dashboard = lazy(() => import('../pages/dashboard'))
const Employees = lazy(() => import('../pages/employees'))
const EmployeeDetail = lazy(() => import('../pages/employees/EmployeeDetail'))
const Clients = lazy(() => import('../pages/clients'))
const ClientDetail = lazy(() => import('../pages/clients/ClientDetail'))
const Pods = lazy(() => import('../pages/pods'))
const PodDetail = lazy(() => import('../pages/pods/PodDetail'))
const Revenue = lazy(() => import('../pages/revenue'))
const Targets = lazy(() => import('../pages/targets'))
const Incentives = lazy(() => import('../pages/incentives'))
const IncentiveCalculator = lazy(() => import('../pages/incentives/IncentiveCalculator'))
const Reports = lazy(() => import('../pages/reports'))
const NotFound = lazy(() => import('../pages/NotFound'))

const Loadable = (Component: React.ComponentType) => (props: any) => (
  <Suspense fallback={<LoadingScreen />}>
    <Component {...props} />
  </Suspense>
)

const routes = (isAuthenticated: boolean) => [
  {
    path: 'auth',
    element: <GuestGuard isAuthenticated={isAuthenticated} />,
    children: [
      {
        path: 'login',
        element: <Loadable(Login) />,
      },
      {
        path: '',
        element: <Navigate to="/auth/login" />,
      },
    ],
  },
  {
    path: '/',
    element: (
      <AuthGuard isAuthenticated={isAuthenticated}>
        <MainLayout />
      </AuthGuard>
    ),
    children: [
      {
        path: '',
        element: <Navigate to="/dashboard" />,
      },
      {
        path: 'dashboard',
        element: <Loadable(Dashboard) />,
      },
      {
        path: 'employees',
        children: [
          {
            path: '',
            element: <Loadable(Employees) />,
          },
          {
            path: ':id',
            element: <Loadable(EmployeeDetail) />,
          },
        ],
      },
      {
        path: 'clients',
        children: [
          {
            path: '',
            element: <Loadable(Clients) />,
          },
          {
            path: ':id',
            element: <Loadable(ClientDetail) />,
          },
        ],
      },
      {
        path: 'pods',
        children: [
          {
            path: '',
            element: <Loadable(Pods) />,
          },
          {
            path: ':id',
            element: <Loadable(PodDetail) />,
          },
        ],
      },
      {
        path: 'revenue',
        element: <Loadable(Revenue) />,
      },
      {
        path: 'targets',
        element: <Loadable(Targets) />,
      },
      {
        path: 'incentives',
        children: [
          {
            path: '',
            element: <Loadable(Incentives) />,
          },
          {
            path: 'calculator',
            element: <Loadable(IncentiveCalculator) />,
          },
        ],
      },
      {
        path: 'reports',
        element: <Loadable(Reports) />,
      },
    ],
  },
  {
    path: '*',
    element: <Loadable(NotFound) />,
  },
]

export default routes
