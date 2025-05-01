import { useState, useEffect } from 'react'
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Button,
  MenuItem,
  TextField,
  CircularProgress,
  useTheme,
} from '@mui/material'
import {
  AttachMoney as RevenueIcon,
  Savings as CostIcon,
  TrendingUp as GrowthIcon,
  Assessment as TargetIcon,
  BarChart as StatsIcon,
} from '@mui/icons-material'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { format, subMonths, getYear, getMonth } from 'date-fns'
import { useAuth } from '../../contexts/AuthContext'
import { getIncentivesByYearAndMonth, getMonthlyRevenues, getEmployeeIncentives, getTargetsByYearAndMonth, getPodCosts } from '../../api'

const Dashboard = () => {
  const theme = useTheme()
  const { user } = useAuth()
  const role = user?.role || 'rs'
  const [isLoading, setIsLoading] = useState(true)
  const [year, setYear] = useState(() => getYear(new Date()))
  const [month, setMonth] = useState(() => getMonth(new Date()) + 1)
  const [incentiveData, setIncentiveData] = useState<any[]>([])
  const [revenueData, setRevenueData] = useState<any[]>([])
  const [targetData, setTargetData] = useState<any[]>([])
  const [podCostData, setPodCostData] = useState<any[]>([])
  const [monthlyPerformanceData, setMonthlyPerformanceData] = useState<any[]>([])
  
  // Generate past 12 months for dropdown
  const generateMonthOptions = () => {
    const options = []
    const currentDate = new Date()
    for (let i = 0; i < 12; i++) {
      const date = subMonths(currentDate, i)
      const y = getYear(date)
      const m = getMonth(date) + 1
      const label = format(date, 'MMMM yyyy')
      options.push({ label, year: y, month: m })
    }
    return options
  }
  
  const monthOptions = generateMonthOptions()
  
  // Handle period change
  const handlePeriodChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const option = monthOptions.find(opt => `${opt.year}-${opt.month}` === event.target.value)
    if (option) {
      setYear(option.year)
      setMonth(option.month)
    }
  }
  
  // Load dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true)
      try {
        // Fetch data based on role
        if (role === 'admin') {
          // Fetch all data for admin
          const [incentives, revenues, targets, costs] = await Promise.all([
            getIncentivesByYearAndMonth(year, month),
            getMonthlyRevenues(year, month),
            getTargetsByYearAndMonth(year, month),
            getPodCosts(year, month)
          ])
          
          setIncentiveData(incentives)
          setRevenueData(revenues)
          setTargetData(targets)
          setPodCostData(costs)
          
          // Prepare monthly performance data for the chart
          const performanceData = []
          
          // Get last 6 months for chart
          for (let i = 0; i < 6; i++) {
            const date = subMonths(new Date(year, month - 1, 1), i)
            const y = getYear(date)
            const m = getMonth(date) + 1
            
            try {
              const incentives = await getIncentivesByYearAndMonth(y, m)
              const revenues = await getMonthlyRevenues(y, m)
              
              const totalRevenue = revenues.reduce((sum, item) => sum + item.amount, 0)
              const totalPayout = incentives.reduce((sum, item) => sum + item.totalPayout, 0)
              
              performanceData.unshift({
                month: format(date, 'MMM yyyy'),
                revenue: totalRevenue,
                payout: totalPayout
              })
            } catch (error) {
              console.error(`Error fetching historical data for ${y}-${m}:`, error)
            }
          }
          
          setMonthlyPerformanceData(performanceData)
        } else if (role === 'kam') {
          // Fetch data for KAM
          const [incentives, costs] = await Promise.all([
            getIncentivesByYearAndMonth(year, month),
            getPodCosts(year, month)
          ])
          
          // Filter data for KAM
          const kamIncentives = incentives.filter(inc => inc.employee.id === user?.employee.id)
          const kamPods = costs.filter(pod => pod.kamId === user?.employee.id)
          
          setIncentiveData(kamIncentives)
          setPodCostData(kamPods)
          
          // Prepare monthly performance data for the chart
          const performanceData = []
          
          // Get last 6 months of incentive data for the KAM
          const employeeIncentives = await getEmployeeIncentives(user?.employee.id || '')
          
          // Organize by month
          for (let i = 0; i < 6; i++) {
            const date = subMonths(new Date(year, month - 1, 1), i)
            const y = getYear(date)
            const m = getMonth(date) + 1
            const monthLabel = format(date, 'MMM yyyy')
            
            const incentive = employeeIncentives.find(inc => inc.year === y && inc.month === m)
            
            performanceData.unshift({
              month: monthLabel,
              achievedGM: incentive?.achievedGM || 0,
              targetGM: incentive?.targetGM || 0
            })
          }
          
          setMonthlyPerformanceData(performanceData)
        } else {
          // Fetch data for OS/RS
          const incentives = await getIncentivesByYearAndMonth(year, month)
          const osRsIncentives = incentives.filter(inc => inc.employee.id === user?.employee.id)
          setIncentiveData(osRsIncentives)
          
          // Prepare monthly performance data for the chart
          const performanceData = []
          
          // Get last 6 months of incentive data for the employee
          const employeeIncentives = await getEmployeeIncentives(user?.employee.id || '')
          
          // Organize by month
          for (let i = 0; i < 6; i++) {
            const date = subMonths(new Date(year, month - 1, 1), i)
            const y = getYear(date)
            const m = getMonth(date) + 1
            const monthLabel = format(date, 'MMM yyyy')
            
            const incentive = employeeIncentives.find(inc => inc.year === y && inc.month === m)
            
            performanceData.unshift({
              month: monthLabel,
              revenue: incentive?.revenue || 0,
              target: incentive?.targetGM ? incentive.targetGM * 100 : 0
            })
          }
          
          setMonthlyPerformanceData(performanceData)
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchDashboardData()
  }, [year, month, role, user?.employee.id])
  
  // Dashboard summary cards based on user role
  const renderSummaryCards = () => {
    if (role === 'admin') {
      const totalRevenue = revenueData.reduce((sum, item) => sum + item.amount, 0)
      const totalPayout = incentiveData.reduce((sum, item) => sum + item.totalPayout, 0)
      const totalCost = podCostData.reduce((sum, pod) => sum + pod.totalCost, 0)
      
      return (
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <RevenueIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6" color="textSecondary">
                    Total Revenue
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  ₹{totalRevenue.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  for {format(new Date(year, month - 1, 1), 'MMMM yyyy')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CostIcon color="error" sx={{ mr: 1 }} />
                  <Typography variant="h6" color="textSecondary">
                    Total Cost
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  ₹{totalCost.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  for {format(new Date(year, month - 1, 1), 'MMMM yyyy')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <GrowthIcon color="success" sx={{ mr: 1 }} />
                  <Typography variant="h6" color="textSecondary">
                    Gross Margin
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {totalCost ? (((totalRevenue - totalCost) / totalCost) * 100).toFixed(2) : 0}%
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  for {format(new Date(year, month - 1, 1), 'MMMM yyyy')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <StatsIcon color="info" sx={{ mr: 1 }} />
                  <Typography variant="h6" color="textSecondary">
                    Total Incentive
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  ₹{totalPayout.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  for {format(new Date(year, month - 1, 1), 'MMMM yyyy')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )
    } else if (role === 'kam') {
      const kamIncentive = incentiveData[0] || {}
      const kamPod = podCostData[0] || {}
      
      return (
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <RevenueIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6" color="textSecondary">
                    Revenue
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  ₹{kamIncentive.revenue?.toLocaleString() || 0}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  for {format(new Date(year, month - 1, 1), 'MMMM yyyy')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CostIcon color="error" sx={{ mr: 1 }} />
                  <Typography variant="h6" color="textSecondary">
                    POD Cost
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  ₹{kamPod.totalCost?.toLocaleString() || 0}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  for {format(new Date(year, month - 1, 1), 'MMMM yyyy')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <GrowthIcon color="success" sx={{ mr: 1 }} />
                  <Typography variant="h6" color="textSecondary">
                    Achieved GM
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {kamIncentive.achievedGM?.toFixed(2) || 0}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  for {format(new Date(year, month - 1, 1), 'MMMM yyyy')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <TargetIcon color="info" sx={{ mr: 1 }} />
                  <Typography variant="h6" color="textSecondary">
                    Target Achievement
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {kamIncentive.targetAchievedPercentage?.toFixed(2) || 0}%
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  for {format(new Date(year, month - 1, 1), 'MMMM yyyy')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )
    } else {
      // OS/RS view
      const employeeIncentive = incentiveData[0] || {}
      
      return (
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <RevenueIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6" color="textSecondary">
                    Revenue
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  ₹{employeeIncentive.revenue?.toLocaleString() || 0}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  for {format(new Date(year, month - 1, 1), 'MMMM yyyy')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <TargetIcon color="info" sx={{ mr: 1 }} />
                  <Typography variant="h6" color="textSecondary">
                    Target Achievement
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {employeeIncentive.targetAchievedPercentage?.toFixed(2) || 0}%
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  for {format(new Date(year, month - 1, 1), 'MMMM yyyy')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <StatsIcon color="success" sx={{ mr: 1 }} />
                  <Typography variant="h6" color="textSecondary">
                    Payout
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  ₹{employeeIncentive.payout?.toLocaleString() || 0}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  for {format(new Date(year, month - 1, 1), 'MMMM yyyy')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <StatsIcon color="warning" sx={{ mr: 1 }} />
                  <Typography variant="h6" color="textSecondary">
                    Total Payout
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  ₹{employeeIncentive.totalPayout?.toLocaleString() || 0}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  for {format(new Date(year, month - 1, 1), 'MMMM yyyy')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )
    }
  }
  
  // Render performance chart based on role
  const renderPerformanceChart = () => {
    if (role === 'admin') {
      return (
        <Paper sx={{ p: 3, height: 400 }}>
          <Typography variant="h6" gutterBottom>
            Revenue & Payout Trend
          </Typography>
          <ResponsiveContainer width="100%" height="90%">
            <LineChart data={monthlyPerformanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip 
                formatter={(value) => [`₹${parseInt(value).toLocaleString()}`, '']}
                labelFormatter={(label) => `Period: ${label}`}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="revenue"
                name="Revenue"
                stroke={theme.palette.primary.main}
                activeDot={{ r: 8 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="payout"
                name="Incentive Payout"
                stroke={theme.palette.success.main}
              />
            </LineChart>
          </ResponsiveContainer>
        </Paper>
      )
    } else if (role === 'kam') {
      return (
        <Paper sx={{ p: 3, height: 400 }}>
          <Typography variant="h6" gutterBottom>
            GM Performance
          </Typography>
          <ResponsiveContainer width="100%" height="90%">
            <LineChart data={monthlyPerformanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                formatter={(value) => [`${parseFloat(value).toFixed(2)}`, '']}
                labelFormatter={(label) => `Period: ${label}`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="achievedGM"
                name="Achieved GM"
                stroke={theme.palette.success.main}
                activeDot={{ r: 8 }}
              />
              <Line
                type="monotone"
                dataKey="targetGM"
                name="Target GM"
                stroke={theme.palette.info.main}
                strokeDasharray="5 5"
              />
            </LineChart>
          </ResponsiveContainer>
        </Paper>
      )
    } else {
      return (
        <Paper sx={{ p: 3, height: 400 }}>
          <Typography variant="h6" gutterBottom>
            Revenue vs Target
          </Typography>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={monthlyPerformanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === 'Revenue') return [`₹${parseInt(value).toLocaleString()}`, name]
                  return [`₹${parseInt(value).toLocaleString()}`, name]
                }}
                labelFormatter={(label) => `Period: ${label}`}
              />
              <Legend />
              <Bar dataKey="revenue" name="Revenue" fill={theme.palette.primary.main} />
              <Bar dataKey="target" name="Target" fill={theme.palette.info.main} />
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      )
    }
  }
  
  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>
        <TextField
          select
          label="Period"
          value={`${year}-${month}`}
          onChange={handlePeriodChange}
          variant="outlined"
          size="small"
          sx={{ minWidth: 200 }}
        >
          {monthOptions.map((option) => (
            <MenuItem key={`${option.year}-${option.month}`} value={`${option.year}-${option.month}`}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      </Box>
      
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {renderSummaryCards()}
          
          <Box sx={{ mt: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                {renderPerformanceChart()}
              </Grid>
            </Grid>
          </Box>
        </>
      )}
    </Box>
  )
}

export default Dashboard
