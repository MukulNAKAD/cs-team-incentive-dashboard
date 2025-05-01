import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Paper,
  Tabs,
  Tab,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Divider,
  Button,
  Dialog,
  IconButton,
  Tooltip,
  CircularProgress,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  useTheme,
} from '@mui/material'
import {
  Person as PersonIcon,
  Badge as DesignationIcon,
  AttachMoney as CostIcon,
  CalendarMonth as DateIcon,
  Edit as EditIcon,
  ArrowBack as BackIcon,
  Groups as PodIcon,
  Business as ClientIcon
} from '@mui/icons-material'
import { format } from 'date-fns'
import { getEmployeeById, updateEmployee, getEmployeePods, getEmployeeClients } from '../../api'
import { EmployeeDetail as EmployeeDetailType, Employee, PodMember, ClientMapping } from '../../types/api'
import PageHeader from '../../components/PageHeader'
import EmployeeForm from './EmployeeForm'
import { useAuth } from '../../contexts/AuthContext'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`employee-tabpanel-${index}`}
      aria-labelledby={`employee-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  )
}

function a11yProps(index: number) {
  return {
    id: `employee-tab-${index}`,
    'aria-controls': `employee-tabpanel-${index}`,
  }
}

const EmployeeDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const theme = useTheme()
  const { user } = useAuth()
  const [employee, setEmployee] = useState<EmployeeDetailType | null>(null)
  const [pods, setPods] = useState<PodMember[]>([])
  const [clients, setClients] = useState<ClientMapping[]>([])
  const [tabValue, setTabValue] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [openEditDialog, setOpenEditDialog] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Check if user has permission to edit
  const hasEditPermission = user?.role === 'admin'

  useEffect(() => {
    const fetchEmployeeData = async () => {
      if (!id) return
      
      setIsLoading(true)
      setError(null)
      
      try {
        const [employeeData, podsData, clientsData] = await Promise.all([
          getEmployeeById(id),
          getEmployeePods(id),
          getEmployeeClients(id)
        ])
        
        setEmployee(employeeData)
        setPods(podsData)
        setClients(clientsData)
      } catch (error: any) {
        console.error('Error fetching employee data:', error)
        setError(error.message || 'Failed to load employee data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchEmployeeData()
  }, [id])

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const handleEditSave = async () => {
    setOpenEditDialog(false)
    if (id) {
      try {
        const updatedEmployee = await getEmployeeById(id)
        setEmployee(updatedEmployee)
      } catch (error) {
        console.error('Error refreshing employee data:', error)
      }
    }
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button 
          startIcon={<BackIcon />} 
          onClick={() => navigate('/employees')}
          sx={{ mt: 2 }}
        >
          Back to Employees
        </Button>
      </Box>
    )
  }

  if (!employee) {
    return (
      <Box sx={{ mt: 4 }}>
        <Alert severity="warning">Employee not found</Alert>
        <Button 
          startIcon={<BackIcon />} 
          onClick={() => navigate('/employees')}
          sx={{ mt: 2 }}
        >
          Back to Employees
        </Button>
      </Box>
    )
  }

  return (
    <Box>
      <PageHeader
        title="Employee Details"
        breadcrumbs={[
          { title: 'Dashboard', path: '/dashboard' },
          { title: 'Employees', path: '/employees' },
          { title: employee.name },
        ]}
        action={
          hasEditPermission
            ? {
                label: 'Edit Employee',
                icon: <EditIcon />,
                onClick: () => setOpenEditDialog(true),
              }
            : undefined
        }
      />

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                <Avatar
                  sx={{
                    width: 100,
                    height: 100,
                    bgcolor: theme.palette.primary.main,
                    mb: 2,
                    fontSize: '2.5rem',
                  }}
                >
                  {employee.name.charAt(0)}
                </Avatar>
                <Typography variant="h5" component="h2">
                  {employee.name}
                </Typography>
                <Chip
                  label={employee.designation.toUpperCase()}
                  color={
                    employee.designation === 'kam'
                      ? 'primary'
                      : employee.designation === 'os'
                      ? 'success'
                      : 'info'
                  }
                  sx={{ mt: 1 }}
                />
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ '& > div': { mb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <PersonIcon sx={{ color: 'primary.main', mr: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Employee ID
                  </Typography>
                  <Typography variant="body1" sx={{ ml: 'auto' }}>
                    {employee.employeeId}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <DesignationIcon sx={{ color: 'primary.main', mr: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Role
                  </Typography>
                  <Typography variant="body1" sx={{ ml: 'auto' }}>
                    {employee.designation === 'kam'
                      ? 'Key Account Manager'
                      : employee.designation === 'os'
                      ? 'Overall Success Manager'
                      : 'Relationship Success Manager'}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CostIcon sx={{ color: 'primary.main', mr: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Monthly Cost
                  </Typography>
                  <Typography variant="body1" sx={{ ml: 'auto' }}>
                    ₹{employee.monthlyCost.toLocaleString()}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <DateIcon sx={{ color: 'primary.main', mr: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Joined Company
                  </Typography>
                  <Typography variant="body1" sx={{ ml: 'auto' }}>
                    {format(new Date(employee.companyJoiningDate), 'dd MMM yyyy')}
                  </Typography>
                </Box>
                
                {employee.noticePeriodStart && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <DateIcon sx={{ color: 'error.main', mr: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      Notice Period
                    </Typography>
                    <Typography variant="body1" sx={{ ml: 'auto', color: 'error.main' }}>
                      {format(new Date(employee.noticePeriodStart), 'dd MMM')} - 
                      {employee.noticePeriodEnd 
                        ? format(new Date(employee.noticePeriodEnd), ' dd MMM yyyy')
                        : ' ongoing'}
                    </Typography>
                  </Box>
                )}
                
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <PodIcon sx={{ color: 'primary.main', mr: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    PODs
                  </Typography>
                  <Typography variant="body1" sx={{ ml: 'auto' }}>
                    {pods.length}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <ClientIcon sx={{ color: 'primary.main', mr: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Clients
                  </Typography>
                  <Typography variant="body1" sx={{ ml: 'auto' }}>
                    {clients.length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Paper sx={{ width: '100%' }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              aria-label="employee information tabs"
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab label="POD Memberships" icon={<PodIcon />} iconPosition="start" {...a11yProps(0)} />
              <Tab label="Client Assignments" icon={<ClientIcon />} iconPosition="start" {...a11yProps(1)} />
            </Tabs>
            
            <TabPanel value={tabValue} index={0}>
              {pods.length === 0 ? (
                <Typography variant="body1" sx={{ p: 2, textAlign: 'center' }}>
                  No POD memberships found for this employee.
                </Typography>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>POD Name</TableCell>
                        <TableCell>KAM</TableCell>
                        <TableCell>Attribution %</TableCell>
                        <TableCell>Joined On</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {pods.map((pod) => (
                        <TableRow key={pod.id}>
                          <TableCell>{pod.pod.name}</TableCell>
                          <TableCell>{pod.pod.kam ? pod.pod.kam.name : 'N/A'}</TableCell>
                          <TableCell>{pod.attributionPercentage}%</TableCell>
                          <TableCell>
                            {format(new Date(pod.podJoiningDate), 'dd MMM yyyy')}
                          </TableCell>
                          <TableCell>
                            {pod.podLeavingDate ? (
                              <Chip 
                                label={`Left: ${format(new Date(pod.podLeavingDate), 'dd MMM yyyy')}`} 
                                color="error" 
                                size="small" 
                              />
                            ) : (
                              <Chip label="Active" color="success" size="small" />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </TabPanel>
            
            <TabPanel value={tabValue} index={1}>
              {clients.length === 0 ? (
                <Typography variant="body1" sx={{ p: 2, textAlign: 'center' }}>
                  No client assignments found for this employee.
                </Typography>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Client Name</TableCell>
                        <TableCell>CRM ID</TableCell>
                        <TableCell>Role</TableCell>
                        <TableCell>Start Date</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {clients.map((client) => (
                        <TableRow key={client.id}>
                          <TableCell>{client.client.name}</TableCell>
                          <TableCell>{client.client.crmId}</TableCell>
                          <TableCell>
                            <Chip 
                              label={client.role.toUpperCase()} 
                              color={
                                client.role === 'kam'
                                  ? 'primary'
                                  : client.role === 'os'
                                  ? 'success'
                                  : 'info'
                              } 
                              size="small" 
                            />
                          </TableCell>
                          <TableCell>
                            {format(new Date(client.startDate), 'dd MMM yyyy')}
                          </TableCell>
                          <TableCell>
                            {client.endDate ? (
                              <Chip 
                                label={`Ended: ${format(new Date(client.endDate), 'dd MMM yyyy')}`} 
                                color="error" 
                                size="small" 
                              />
                            ) : (
                              <Chip label="Active" color="success" size="small" />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </TabPanel>
          </Paper>
        </Grid>
      </Grid>

      {/* Edit Employee Dialog */}
      <Dialog 
        open={openEditDialog} 
        onClose={() => setOpenEditDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6">Edit Employee</Typography>
        </Box>
        <Divider />
        <Box sx={{ p: 3 }}>
          <EmployeeForm employeeId={id} onSave={handleEditSave} />
        </Box>
      </Dialog>
    </Box>
  )
}

export default EmployeeDetail
