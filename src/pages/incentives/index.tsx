import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Paper,
  Button,
  CircularProgress,
  Grid,
  Tooltip,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Card,
  CardContent,
  Chip,
  Divider,
  useTheme,
} from '@mui/material'
import { 
  DataGrid, 
  GridColDef, 
  GridRenderCellParams,
  GridValueFormatterParams,
  GridToolbar,
} from '@mui/x-data-grid'
import { 
  Calculate as CalculateIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  TrendingUp as TrendingUpIcon,
  Download as DownloadIcon,
} from '@mui/icons-material'
import { format } from 'date-fns'
import { useAuth } from '../../contexts/AuthContext'
import { 
  getIncentivesByYearAndMonth, 
  getEmployeeIncentives, 
  freezeIncentives,
  getIncentiveByEmployeeAndPeriod
} from '../../api'
import { Incentive } from '../../types/api'
import PageHeader from '../../components/PageHeader'

const IncentivesPage = () => {
  const navigate = useNavigate()
  const theme = useTheme()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  
  const [incentives, setIncentives] = useState<Incentive[]>([])
  const [userIncentive, setUserIncentive] = useState<Incentive | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [userLoading, setUserLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [year, setYear] = useState<number>(new Date().getFullYear())
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1)
  const [isFreezing, setIsFreezing] = useState(false)

  // Fetch incentives data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        
        if (isAdmin) {
          const incentivesData = await getIncentivesByYearAndMonth(year, month)
          setIncentives(incentivesData)
        }
      } catch (error) {
        console.error('Error fetching incentives:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [isAdmin, year, month])

  // Fetch current user's incentive
  useEffect(() => {
    const fetchUserIncentive = async () => {
      if (!user?.employee?.id) return
      
      try {
        setUserLoading(true)
        
        const data = await getIncentiveByEmployeeAndPeriod({
          employeeId: user.employee.id,
          year,
          month
        })
        
        setUserIncentive(data)
      } catch (error) {
        console.error('Error fetching user incentive:', error)
        setUserIncentive(null)
      } finally {
        setUserLoading(false)
      }
    }

    if (!isAdmin && user?.employee?.id) {
      fetchUserIncentive()
    }
  }, [isAdmin, user?.employee?.id, year, month])

  // Helper function to get months array
  const getMonths = () => {
    return [
      { value: 1, label: 'January' },
      { value: 2, label: 'February' },
      { value: 3, label: 'March' },
      { value: 4, label: 'April' },
      { value: 5, label: 'May' },
      { value: 6, label: 'June' },
      { value: 7, label: 'July' },
      { value: 8, label: 'August' },
      { value: 9, label: 'September' },
      { value: 10, label: 'October' },
      { value: 11, label: 'November' },
      { value: 12, label: 'December' },
    ]
  }

  // Helper function to get years array (current year and previous/next year)
  const getYears = () => {
    const currentYear = new Date().getFullYear()
    return [
      { value: currentYear + 1, label: (currentYear + 1).toString() },
      { value: currentYear, label: currentYear.toString() },
      { value: currentYear - 1, label: (currentYear - 1).toString() },
    ]
  }

  // Handle freezing/unfreezing incentives
  const handleFreezeToggle = async () => {
    try {
      setIsFreezing(true)
      
      // Get current freeze status from any incentive
      const isFrozen = incentives.length > 0 ? incentives[0].isFrozen : false
      
      await freezeIncentives({
        year,
        month,
        freeze: !isFrozen
      })
      
      // Refresh incentives
      const updatedIncentives = await getIncentivesByYearAndMonth(year, month)
      setIncentives(updatedIncentives)
    } catch (error) {
      console.error('Error toggling freeze status:', error)
    } finally {
      setIsFreezing(false)
    }
  }

  // DataGrid columns
  const columns: GridColDef[] = [
    { 
      field: 'employee', 
      headerName: 'Employee', 
      flex: 1.5,
      minWidth: 180,
      valueGetter: (params) => params.row.employee.name
    },
    { 
      field: 'designation', 
      headerName: 'Role', 
      flex: 1,
      minWidth: 120,
      valueGetter: (params) => params.row.employee.designation,
      renderCell: (params: GridRenderCellParams<any>) => {
        const designation = params.value.toUpperCase()
        return (
          <Chip 
            label={designation} 
            color={
              designation === 'KAM'
                ? 'primary'
                : designation === 'OS'
                ? 'success'
                : 'info'
            } 
            size="small" 
          />
        )
      }
    },
    {
      field: 'revenue',
      headerName: 'Revenue',
      flex: 1,
      minWidth: 130,
      align: 'right',
      valueFormatter: (params: GridValueFormatterParams<number>) => {
        return `₹${params.value.toLocaleString()}`
      }
    },
    {
      field: 'targetAchievedPercentage',
      headerName: 'Target %',
      flex: 0.8,
      minWidth: 100,
      align: 'right',
      valueFormatter: (params: GridValueFormatterParams<number>) => {
        return `${params.value.toFixed(2)}%`
      }
    },
    {
      field: 'incentiveMultiplier',
      headerName: 'Multiplier',
      flex: 0.8,
      minWidth: 100,
      align: 'center',
    },
    {
      field: 'payout',
      headerName: 'Payout',
      flex: 1,
      minWidth: 120,
      align: 'right',
      valueFormatter: (params: GridValueFormatterParams<number>) => {
        return `₹${params.value.toLocaleString()}`
      }
    },
    {
      field: 'arrears',
      headerName: 'Arrears',
      flex: 1,
      minWidth: 120,
      align: 'right',
      valueFormatter: (params: GridValueFormatterParams<number>) => {
        return `₹${params.value.toLocaleString()}`
      }
    },
    {
      field: 'totalPayout',
      headerName: 'Total Payout',
      flex: 1,
      minWidth: 130,
      align: 'right',
      valueFormatter: (params: GridValueFormatterParams<number>) => {
        return `₹${params.value.toLocaleString()}`
      }
    },
  ]

  return (
    <Box>
      <PageHeader
        title="Incentives"
        subtitle="View incentive calculations and payouts"
        breadcrumbs={[
          { title: 'Dashboard', path: '/dashboard' },
          { title: 'Incentives' },
        ]}
        action={
          isAdmin
            ? {
                label: 'Incentive Calculator',
                icon: <CalculateIcon />,
                onClick: () => navigate('/incentives/calculator'),
              }
            : undefined
        }
      />

      <Grid container spacing={3}>
        {!isAdmin && (
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Your Incentive</Typography>
                  
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <FormControl size="small" sx={{ minWidth: 100 }}>
                      <InputLabel id="month-label">Month</InputLabel>
                      <Select
                        labelId="month-label"
                        value={month}
                        onChange={(e) => setMonth(Number(e.target.value))}
                        label="Month"
                      >
                        {getMonths().map(month => (
                          <MenuItem key={month.value} value={month.value}>
                            {month.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    
                    <FormControl size="small" sx={{ minWidth: 80 }}>
                      <InputLabel id="year-label">Year</InputLabel>
                      <Select
                        labelId="year-label"
                        value={year}
                        onChange={(e) => setYear(Number(e.target.value))}
                        label="Year"
                      >
                        {getYears().map(year => (
                          <MenuItem key={year.value} value={year.value}>
                            {year.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                </Box>
                
                {userLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress size={40} />
                  </Box>
                ) : !userIncentive ? (
                  <Alert severity="info">
                    No incentive data available for this period.
                  </Alert>
                ) : (
                  <Box>
                    <Box sx={{ 
                      p: 2, 
                      mb: 3, 
                      bgcolor: theme.palette.background.default,
                      borderRadius: 1
                    }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Performance Summary
                      </Typography>
                      
                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Revenue:</Typography>
                          <Typography variant="h6">₹{userIncentive.revenue.toLocaleString()}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Target Achieved:</Typography>
                          <Typography variant="h6">{userIncentive.targetAchievedPercentage.toFixed(2)}%</Typography>
                        </Grid>
                      </Grid>
                    </Box>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Typography variant="subtitle1" gutterBottom>
                      Payout Details
                    </Typography>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Base Payout:</Typography>
                        <Typography variant="body1">₹{userIncentive.payout.toLocaleString()}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Multiplier:</Typography>
                        <Typography variant="body1">{userIncentive.incentiveMultiplier}x</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Arrears:</Typography>
                        <Typography variant="body1">₹{userIncentive.arrears.toLocaleString()}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Status:</Typography>
                        <Chip 
                          label={userIncentive.isFrozen ? "Finalized" : "Pending"} 
                          color={userIncentive.isFrozen ? "success" : "warning"} 
                          size="small" 
                        />
                      </Grid>
                    </Grid>
                    
                    <Box sx={{ 
                      mt: 3, 
                      p: 2, 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center',
                      bgcolor: theme.palette.primary.main,
                      color: theme.palette.primary.contrastText,
                      borderRadius: 1
                    }}>
                      <Typography variant="subtitle1" sx={{ mb: 1 }}>
                        Total Payout
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                        ₹{userIncentive.totalPayout.toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}
        
        <Grid item xs={12} md={isAdmin ? 12 : 8}>
          <Paper sx={{ p: 3, height: '100%' }}>
            {isAdmin && (
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                mb: 3
              }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel id="admin-month-label">Month</InputLabel>
                    <Select
                      labelId="admin-month-label"
                      value={month}
                      onChange={(e) => setMonth(Number(e.target.value))}
                      label="Month"
                    >
                      {getMonths().map(month => (
                        <MenuItem key={month.value} value={month.value}>
                          {month.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  
                  <FormControl size="small" sx={{ minWidth: 100 }}>
                    <InputLabel id="admin-year-label">Year</InputLabel>
                    <Select
                      labelId="admin-year-label"
                      value={year}
                      onChange={(e) => setYear(Number(e.target.value))}
                      label="Year"
                    >
                      {getYears().map(year => (
                        <MenuItem key={year.value} value={year.value}>
                          {year.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
                
                {incentives.length > 0 && (
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      variant="outlined"
                      onClick={handleFreezeToggle}
                      disabled={isFreezing}
                      startIcon={incentives[0].isFrozen ? <LockOpenIcon /> : <LockIcon />}
                    >
                      {incentives[0].isFrozen ? 'Unfreeze Incentives' : 'Freeze Incentives'}
                    </Button>
                    
                    <Button
                      variant="outlined"
                      startIcon={<DownloadIcon />}
                    >
                      Export Report
                    </Button>
                  </Box>
                )}
              </Box>
            )}
            
            {incentives.length > 0 && (
              <Box sx={{ mb: 3, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Total Payout Amount</Typography>
                  <Typography variant="h5">
                    ₹{incentives.reduce((sum, inc) => sum + inc.totalPayout, 0).toLocaleString()}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary">Status</Typography>
                  <Chip 
                    label={incentives[0].isFrozen ? "Finalized" : "Pending"} 
                    color={incentives[0].isFrozen ? "success" : "warning"} 
                    size="small" 
                  />
                </Box>
              </Box>
            )}
            
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                {isAdmin ? (
                  incentives.length === 0 ? (
                    <Alert 
                      severity="info" 
                      action={
                        <Button 
                          color="inherit" 
                          size="small" 
                          onClick={() => navigate('/incentives/calculator')}
                        >
                          Calculate Now
                        </Button>
                      }
                    >
                      No incentives have been calculated for this period.
                    </Alert>
                  ) : (
                    <DataGrid
                      rows={incentives}
                      columns={columns}
                      initialState={{
                        pagination: {
                          paginationModel: { page: 0, pageSize: 10 },
                        },
                        sorting: {
                          sortModel: [{ field: 'totalPayout', sort: 'desc' }],
                        },
                      }}
                      pageSizeOptions={[10, 25, 50]}
                      getRowId={(row) => row.id}
                      autoHeight
                      components={{ Toolbar: GridToolbar }}
                      disableRowSelectionOnClick
                      sx={{
                        '& .MuiDataGrid-cell:focus-within, & .MuiDataGrid-cell:focus': {
                          outline: 'none',
                        },
                      }}
                    />
                  )
                ) : (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Historical Performance
                    </Typography>
                    
                    {/* Here you would typically add a chart showing performance over time */}
                    <Alert severity="info">
                      Your performance metrics and payout history would be displayed here.
                    </Alert>
                  </Box>
                )}
              </>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}

export default IncentivesPage
