import { ReactNode, useState, useEffect } from 'react'
import { NavLink as RouterLink, useLocation } from 'react-router-dom'
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Divider,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  Group as GroupIcon,
  AttachMoney as AttachMoneyIcon,
  Assessment as AssessmentIcon,
  BarChart as BarChartIcon,
  Description as DescriptionIcon,
  ExpandLess,
  ExpandMore,
} from '@mui/icons-material'
import { useAuth } from '../../contexts/AuthContext'

interface NavigationItemProps {
  title: string
  path: string
  icon: ReactNode
  children?: { title: string; path: string }[]
  roles?: string[]
}

const navigationItems: NavigationItemProps[] = [
  {
    title: 'Dashboard',
    path: '/dashboard',
    icon: <DashboardIcon />,
  },
  {
    title: 'Employees',
    path: '/employees',
    icon: <PeopleIcon />,
    roles: ['admin', 'kam'],
  },
  {
    title: 'Clients',
    path: '/clients',
    icon: <BusinessIcon />,
  },
  {
    title: 'PODs',
    path: '/pods',
    icon: <GroupIcon />,
    roles: ['admin', 'kam'],
  },
  {
    title: 'Revenue',
    path: '/revenue',
    icon: <AttachMoneyIcon />,
    roles: ['admin'],
  },
  {
    title: 'Targets',
    path: '/targets',
    icon: <AssessmentIcon />,
    roles: ['admin'],
  },
  {
    title: 'Incentives',
    path: '/incentives',
    icon: <BarChartIcon />,
    children: [
      {
        title: 'View Incentives',
        path: '/incentives',
      },
      {
        title: 'Incentive Calculator',
        path: '/incentives/calculator',
        roles: ['admin'],
      },
    ],
  },
  {
    title: 'Reports',
    path: '/reports',
    icon: <DescriptionIcon />,
  },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

const Sidebar = ({ open, onClose }: SidebarProps) => {
  const theme = useTheme()
  const location = useLocation()
  const { user } = useAuth()
  const userRole = user?.role || 'rs'
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [expandedItems, setExpandedItems] = useState<{ [key: string]: boolean }>({})

  // If mobile, close drawer after navigation
  const handleNavigation = () => {
    if (isMobile) {
      onClose()
    }
  }

  // Expand items based on current location
  useEffect(() => {
    const newExpandedItems = { ...expandedItems }
    navigationItems.forEach((item) => {
      if (item.children) {
        const isChildActive = item.children.some((child) => 
          location.pathname === child.path || location.pathname.startsWith(child.path + '/')
        )
        if (isChildActive) {
          newExpandedItems[item.title] = true
        }
      }
    })
    setExpandedItems(newExpandedItems)
  }, [location.pathname])

  const handleClick = (title: string) => {
    setExpandedItems({
      ...expandedItems,
      [title]: !expandedItems[title],
    })
  }

  // Check if user has permission to access the item
  const hasPermission = (roles?: string[]) => {
    if (!roles) return true
    return roles.includes(userRole)
  }

  // Render navigation items
  const renderNavItems = (items: NavigationItemProps[]) => (
    <List>
      {items
        .filter((item) => hasPermission(item.roles))
        .map((item) => {
          // For items with children
          if (item.children) {
            return (
              <Box key={item.title}>
                <ListItemButton onClick={() => handleClick(item.title)}>
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.title} />
                  {expandedItems[item.title] ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>
                <Collapse in={expandedItems[item.title]} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {item.children
                      .filter((child) => hasPermission(child.roles))
                      .map((child) => (
                        <ListItemButton
                          key={child.path}
                          component={RouterLink}
                          to={child.path}
                          onClick={handleNavigation}
                          sx={{
                            pl: 4,
                            bgcolor: location.pathname === child.path ? 'action.selected' : 'transparent',
                            '&:hover': {
                              bgcolor: 'action.hover',
                            },
                          }}
                        >
                          <ListItemText primary={child.title} />
                        </ListItemButton>
                      ))}
                  </List>
                </Collapse>
              </Box>
            )
          }

          // For items without children
          return (
            <ListItemButton
              key={item.path}
              component={RouterLink}
              to={item.path}
              onClick={handleNavigation}
              sx={{
                bgcolor: location.pathname === item.path ? 'action.selected' : 'transparent',
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.title} />
            </ListItemButton>
          )
        })}
    </List>
  )

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: 64,
        }}
      >
        <Typography variant="h6" color="primary">
          CS Team Incentive
        </Typography>
      </Box>
      <Divider />
      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 1 }}>
        {renderNavItems(navigationItems)}
      </Box>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary" align="center">
          {user ? `${user.employee.name} (${user.role.toUpperCase()})` : 'User'}
        </Typography>
      </Box>
    </Box>
  )

  return (
    <>
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: 280,
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            width: 280,
            borderRight: `1px solid ${theme.palette.divider}`,
            boxSizing: 'border-box',
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </>
  )
}

export default Sidebar
