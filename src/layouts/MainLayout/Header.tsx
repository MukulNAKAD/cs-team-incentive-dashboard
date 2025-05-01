import { useState } from 'react'
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  MenuItem,
  Box,
  Tooltip,
  Avatar,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import {
  Menu as MenuIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  AccountCircle,
  Logout,
} from '@mui/icons-material'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme as useAppTheme } from '../../contexts/ThemeContext'

interface HeaderProps {
  onOpenSidebar: () => void
}

const Header = ({ onOpenSidebar }: HeaderProps) => {
  const theme = useTheme()
  const { mode, toggleTheme } = useAppTheme()
  const { user, logout } = useAuth()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleLogout = () => {
    handleMenuClose()
    logout()
  }

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        bgcolor: 'background.paper',
        color: 'text.primary',
        borderBottom: `1px solid ${theme.palette.divider}`,
        zIndex: theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar>
        {isMobile && (
          <IconButton
            edge="start"
            color="inherit"
            aria-label="open drawer"
            onClick={onOpenSidebar}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        )}

        <Typography
          variant="h6"
          component="div"
          sx={{ 
            display: { xs: 'none', sm: 'block' },
            flexGrow: 1,
          }}
        >
          CS Team Incentive Dashboard
        </Typography>

        <Box sx={{ flexGrow: { xs: 1, sm: 0 } }} />

        {/* Dark Mode Toggle */}
        <Tooltip title={mode === 'dark' ? 'Light Mode' : 'Dark Mode'}>
          <IconButton
            color="inherit"
            onClick={toggleTheme}
            sx={{ mr: 1 }}
          >
            {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
        </Tooltip>

        {/* User Menu */}
        <Box>
          <Tooltip title="Account">
            <IconButton
              onClick={handleMenuOpen}
              color="inherit"
              aria-controls="user-menu"
              aria-haspopup="true"
            >
              {user?.employee?.name ? (
                <Avatar 
                  sx={{ 
                    width: 32, 
                    height: 32, 
                    bgcolor: theme.palette.primary.main 
                  }}
                >
                  {user.employee.name.charAt(0)}
                </Avatar>
              ) : (
                <AccountCircle />
              )}
            </IconButton>
          </Tooltip>
          <Menu
            id="user-menu"
            anchorEl={anchorEl}
            keepMounted
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <MenuItem disabled>
              <Typography variant="body2">
                {user?.employee?.name || 'User'}{' '}
                <Typography
                  component="span"
                  variant="caption"
                  color="text.secondary"
                >
                  ({user?.role.toUpperCase() || 'Role'})
                </Typography>
              </Typography>
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <Logout fontSize="small" sx={{ mr: 1 }} />
              Logout
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  )
}

export default Header
