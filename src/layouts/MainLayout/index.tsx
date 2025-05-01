import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Box, Toolbar, Container, useTheme } from '@mui/material'
import Header from './Header'
import Sidebar from './Sidebar'

const MainLayout = () => {
  const theme = useTheme()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleOpenSidebar = () => {
    setSidebarOpen(true)
  }

  const handleCloseSidebar = () => {
    setSidebarOpen(false)
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Header */}
      <Header onOpenSidebar={handleOpenSidebar} />

      {/* Sidebar */}
      <Sidebar open={sidebarOpen} onClose={handleCloseSidebar} />

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: 'background.default',
          display: 'flex',
          flexDirection: 'column',
          width: { md: `calc(100% - 280px)` },
        }}
      >
        <Toolbar /> {/* Add space for fixed header */}
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4, flex: 1 }}>
          <Outlet />
        </Container>
        
        {/* Footer */}
        <Box
          component="footer"
          sx={{
            mt: 'auto',
            py: 2,
            px: 2,
            textAlign: 'center',
            color: 'text.secondary',
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(0, 0, 0, 0.03)',
            borderTop: `1px solid ${theme.palette.divider}`,
          }}
        >
          © {new Date().getFullYear()} CS Team Incentive Dashboard Tracker
        </Box>
      </Box>
    </Box>
  )
}

export default MainLayout
