import { 
  Typography, 
  Box, 
  Breadcrumbs, 
  Link as MuiLink, 
  Button, 
  useTheme,
  useMediaQuery
} from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { ReactNode } from 'react'

interface BreadcrumbItem {
  title: string
  path?: string
}

interface PageHeaderProps {
  title: string
  subtitle?: string
  breadcrumbs?: BreadcrumbItem[]
  action?: {
    label: string
    icon?: ReactNode
    onClick: () => void
    variant?: 'text' | 'outlined' | 'contained'
    color?: 'inherit' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning'
  }
}

const PageHeader = ({ title, subtitle, breadcrumbs, action }: PageHeaderProps) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  return (
    <Box sx={{ mb: 4 }}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs sx={{ mb: 1 }}>
          {breadcrumbs.map((item, index) => {
            const isLast = index === breadcrumbs.length - 1

            if (isLast || !item.path) {
              return (
                <Typography 
                  key={index} 
                  color="text.primary"
                  variant="body2"
                >
                  {item.title}
                </Typography>
              )
            }

            return (
              <MuiLink
                key={index}
                component={RouterLink}
                to={item.path}
                color="inherit"
                underline="hover"
                variant="body2"
              >
                {item.title}
              </MuiLink>
            )
          })}
        </Breadcrumbs>
      )}

      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: isMobile ? 'flex-start' : 'center',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 2 : 0
        }}
      >
        <Box>
          <Typography variant="h4" component="h1">
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
              {subtitle}
            </Typography>
          )}
        </Box>

        {action && (
          <Button
            variant={action.variant || 'contained'}
            color={action.color || 'primary'}
            startIcon={action.icon}
            onClick={action.onClick}
          >
            {action.label}
          </Button>
        )}
      </Box>
    </Box>
  )
}

export default PageHeader
