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
  Divider,
  Button,
  Dialog,
  IconButton,
  Tooltip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  Stack,
  Chip,
  useTheme,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import {
  Business as BusinessIcon,
  ListAlt as ListIcon,
  Edit as EditIcon,
  ArrowBack as BackIcon,
  Person as PersonIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material'
import { format } from 'date-fns'
import { 
  getClientById, 
  updateClient, 
  getClientMappings, 
  createClientMapping, 
  updateClientMapping,
  getAllEmployees
} from '../../api'
import { 
  ClientDetail as ClientDetailType, 
  Client, 
  ClientMapping, 
  CreateClientMappingDto,
  UpdateClientMappingDto,
  Employee
} from '../../types/api'
import PageHeader from '../../components/PageHeader'
import ClientForm from './ClientForm'
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
      id={`client-tabpanel-${index}`}
      aria-labelledby={`client-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  )
}

function a11yProps(index: number) {
  return {
    id: `client-tab-${index}`,
    'aria-controls': `client-tabpanel-${index}`,
  }
}

interface MappingFormData {
  employeeId: string
  role: 'kam' | 'os' | 'rs'
  startDate: string
  endDate?: string
}

interface MappingFormErrors {
  employeeId?: string
  role?: string
  startDate?: string
  endDate?: string
}

const ClientDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const theme = useTheme()
  const { user } = useAuth()
  const [client, setClient] = useState<ClientDetailType | null>(null)
  const [mappings, setMappings] = useState<ClientMapping[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [tabValue, setTabValue] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [openEditDialog, setOpenEditDialog] = useState(false)
  const [openMappingDialog, setOpenMappingDialog] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingMappingId, setEditingMappingId] = useState<string | null>(null)
  const [mappingFormData, setMappingFormData] = useState<MappingFormData>({
    employeeId: '',
    role: 'rs',
    startDate: new Date().toISOString().split('T')[0],
  })
  const [mappingErrors, setMappingErrors] = useState<MappingFormErrors>({})
  const [startDate, setStartDate] = useState<Date | null>(new Date())
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [isSavingMapping, setIsSavingMapping] = useState(false)
  
  // Check if user has permission to edit
  const hasEditPermission = user?.role === 'admin'

  useEffect(() => {
    const fetchClientData = async () => {
      if (!id) return
      
      setIsLoading(true)
      setError(null)
      
      try {
        const [clientData, mappingsData, employeesData] = await Promise.all([
          getClientById(id),
          getClientMappings(id),
          getAllEmployees()
        ])
        
        setClient(clientData)
        setMappings(mappingsData)
        setEmployees(employeesData)
      } catch (error: any) {
        console.error('Error fetching client data:', error)
        setError(error.message || 'Failed to load client data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchClientData()
  }, [id])

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const handleEditSave = async () => {
    setOpenEditDialog(false)
    if (id) {
      try {
        const updatedClient = await getClientById(id)
        setClient(updatedClient)
      } catch (error) {
        console.error('Error refreshing client data:', error)
      }
    }
  }

  // Handle mapping form input changes
  const handleMappingChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target
    if (name) {
      setMappingFormData((prev) => ({
        ...prev,
        [name]: value,
      }))
    }
  }

  // Handle date changes
  const handleDateChange = (date: Date | null, field: string) => {
    if (field === 'startDate') {
      setStartDate(date)
      if (date) {
        setMappingFormData((prev) => ({
          ...prev,
          startDate: date.toISOString().split('T')[0],
        }))
      }
    } else if (field === 'endDate') {
      setEndDate(date)
      if (date) {
        setMappingFormData((prev) => ({
          ...prev,
          endDate: date.toISOString().split('T')[0],
        }))
      } else {
        setMappingFormData((prev) => {
          const newData = { ...prev }
          delete newData.endDate
          return newData
        })
      }
    }
  }

  // Validate mapping form
  const validateMappingForm = (): boolean => {
    const newErrors: MappingFormErrors = {}

    if (!mappingFormData.employeeId) {
      newErrors.employeeId = 'Employee is required'
    }

    if (!mappingFormData.role) {
      newErrors.role = 'Role is required'
    }

    if (!mappingFormData.startDate) {
      newErrors.startDate = 'Start date is required'
    }

    // End date should be after start date
    if (
      mappingFormData.startDate &&
      mappingFormData.endDate &&
      new Date(mappingFormData.startDate) >= new Date(mappingFormData.endDate)
    ) {
      newErrors.endDate = 'End date should be after start date'
    }

    setMappingErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Reset mapping form
  const resetMappingForm = () => {
    setMappingFormData({
      employeeId: '',
      role: 'rs',
      startDate: new Date().toISOString().split('T')[0],
    })
    setStartDate(new Date())
    setEndDate(null)
    setEditingMappingId(null)
    setMappingErrors({})
  }

  // Open mapping dialog for editing
  const handleEditMapping = (mapping: ClientMapping) => {
    setEditingMappingId(mapping.id)
    setMappingFormData({
      employeeId: mapping.employee.id,
      role: mapping.role,
      startDate: mapping.startDate,
      endDate: mapping.endDate || undefined,
    })
    setStartDate(new Date(mapping.startDate))
    setEndDate(mapping.endDate ? new Date(mapping.endDate) : null)
    setOpenMappingDialog(true)
  }

  // Handle mapping form submission
  const handleSaveMapping = async () => {
    if (!validateMappingForm() || !id) return

    setIsSavingMapping(true)

    try {
      if (editingMappingId) {
        // Update existing mapping
        const updateData: UpdateClientMappingDto = {
          employeeId: mappingFormData.employeeId,
          endDate: mappingFormData.endDate,
        }
        
        await updateClientMapping(editingMappingId, updateData)
      } else {
        // Create new mapping
        const createData: CreateClientMappingDto = {
          clientId: id,
          employeeId: mappingFormData.employeeId,
          role: mappingFormData.role,
          startDate: mappingFormData.startDate,
          endDate: mappingFormData.endDate,
        }
        
        await createClientMapping(createData)
      }
      
      // Refresh mappings
      const updatedMappings = await getClientMappings(id)
      setMappings(updatedMappings)
      
      setOpenMappingDialog(false)
      resetMappingForm()
    } catch (error: any) {
      console.error('Error saving mapping:', error)
    } finally {
      setIsSavingMapping(false)
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
          onClick={() => navigate('/clients')}
          sx={{ mt: 2 }}
        >
          Back to Clients
        </Button>
      </Box>
    )
  }

  if (!client) {
    return (
      <Box sx={{ mt: 4 }}>
        <Alert severity="warning">Client not found</Alert>
        <Button 
          startIcon={<BackIcon />} 
          onClick={() => navigate('/clients')}
          sx={{ mt: 2 }}
        >
          Back to Clients
        </Button>
      </Box>
    )
  }

  // Helper to filter available employees based on role
  const getAvailableEmployees = (role: 'kam' | 'os' | 'rs') => {
    return employees.filter(emp => {
      // Check if employee has the right designation
      if (emp.designation !== role) return false
      
      // If editing, allow current employee
      if (editingMappingId) {
        const currentMapping = mappings.find(m => m.id === editingMappingId)
        if (currentMapping && currentMapping.employee.id === emp.id) return true
      }
      
      // Check if employee is already mapped with same role (and not ended)
      const hasActiveMapping = mappings.some(m => 
        m.employee.id === emp.id && 
        m.role === role && 
        !m.endDate &&
        (!editingMappingId || m.id !== editingMappingId) // Skip current mapping when editing
      )
      
      return !hasActiveMapping
    })
  }

  // Get the active mappings for each role
  const getActiveMapping = (role: 'kam' | 'os' | 'rs'): ClientMapping | undefined => {
    return mappings.find(m => m.role === role && !m.endDate)
  }

  const activeKAM = getActiveMapping('kam')
  const activeOS = getActiveMapping('os')
  const activeRS = getActiveMapping('rs')

  return (
    <Box>
      <PageHeader
        title="Client Details"
        breadcrumbs={[
          { title: 'Dashboard', path: '/dashboard' },
          { title: 'Clients', path: '/clients' },
          { title: client.name },
        ]}
        action={
          hasEditPermission
            ? {
                label: 'Edit Client',
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
              <Box sx={{ display: 'flex', flexDirection: 'column', mb: 3 }}>
                <Typography variant="h5" component="h2">
                  {client.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  CRM ID: {client.crmId}
                </Typography>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="h6" gutterBottom>
                Current Team
              </Typography>
              
              <Box sx={{ mt: 2 }}>
                <Paper sx={{ p: 2, mb: 2, bgcolor: activeKAM ? theme.palette.background.paper : 'grey.100' }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="subtitle2" color="primary">
                        Key Account Manager
                      </Typography>
                      <Typography variant="body1">
                        {activeKAM ? activeKAM.employee.name : 'Not Assigned'}
                      </Typography>
                      {activeKAM && (
                        <Typography variant="body2" color="text.secondary">
                          Since {format(new Date(activeKAM.startDate), 'dd MMM yyyy')}
                        </Typography>
                      )}
                    </Box>
                    {hasEditPermission && (
                      <Tooltip title={activeKAM ? "Change KAM" : "Assign KAM"}>
                        <IconButton
                          size="small"
                          onClick={() => {
                            resetMappingForm()
                            setMappingFormData(prev => ({ ...prev, role: 'kam' }))
                            setOpenMappingDialog(true)
                          }}
                          color="primary"
                        >
                          {activeKAM ? <EditIcon /> : <AddIcon />}
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>
                </Paper>
                
                <Paper sx={{ p: 2, mb: 2, bgcolor: activeOS ? theme.palette.background.paper : 'grey.100' }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="subtitle2" color="success.main">
                        Overall Success Manager
                      </Typography>
                      <Typography variant="body1">
                        {activeOS ? activeOS.employee.name : 'Not Assigned'}
                      </Typography>
                      {activeOS && (
                        <Typography variant="body2" color="text.secondary">
                          Since {format(new Date(activeOS.startDate), 'dd MMM yyyy')}
                        </Typography>
                      )}
                    </Box>
                    {hasEditPermission && (
                      <Tooltip title={activeOS ? "Change OS" : "Assign OS"}>
                        <IconButton
                          size="small"
                          onClick={() => {
                            resetMappingForm()
                            setMappingFormData(prev => ({ ...prev, role: 'os' }))
                            setOpenMappingDialog(true)
                          }}
                          color="success"
                        >
                          {activeOS ? <EditIcon /> : <AddIcon />}
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>
                </Paper>
                
                <Paper sx={{ p: 2, bgcolor: activeRS ? theme.palette.background.paper : 'grey.100' }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="subtitle2" color="info.main">
                        Relationship Success Manager
                      </Typography>
                      <Typography variant="body1">
                        {activeRS ? activeRS.employee.name : 'Not Assigned'}
                      </Typography>
                      {activeRS && (
                        <Typography variant="body2" color="text.secondary">
                          Since {format(new Date(activeRS.startDate), 'dd MMM yyyy')}
                        </Typography>
                      )}
                    </Box>
                    {hasEditPermission && (
                      <Tooltip title={activeRS ? "Change RS" : "Assign RS"}>
                        <IconButton
                          size="small"
                          onClick={() => {
                            resetMappingForm()
                            setMappingFormData(prev => ({ ...prev, role: 'rs' }))
                            setOpenMappingDialog(true)
                          }}
                          color="info"
                        >
                          {activeRS ? <EditIcon /> : <AddIcon />}
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>
                </Paper>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Paper sx={{ width: '100%' }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              aria-label="client information tabs"
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab label="Assignment History" icon={<ListIcon />} iconPosition="start" {...a11yProps(0)} />
            </Tabs>
            
            <TabPanel value={tabValue} index={0}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Employee Assignment History</Typography>
                
                {hasEditPermission && (
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    size="small"
                    onClick={() => {
                      resetMappingForm()
                      setOpenMappingDialog(true)
                    }}
                  >
                    New Assignment
                  </Button>
                )}
              </Box>
              
              {mappings.length === 0 ? (
                <Typography variant="body1" sx={{ p: 2, textAlign: 'center' }}>
                  No employee assignments found for this client.
                </Typography>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Employee</TableCell>
                        <TableCell>Role</TableCell>
                        <TableCell>Start Date</TableCell>
                        <TableCell>End Date</TableCell>
                        <TableCell>Status</TableCell>
                        {hasEditPermission && <TableCell align="right">Actions</TableCell>}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {mappings.map((mapping) => (
                        <TableRow key={mapping.id}>
                          <TableCell>{mapping.employee.name}</TableCell>
                          <TableCell>
                            <Chip 
                              label={mapping.role.toUpperCase()} 
                              color={
                                mapping.role === 'kam'
                                  ? 'primary'
                                  : mapping.role === 'os'
                                  ? 'success'
                                  : 'info'
                              } 
                              size="small" 
                            />
                          </TableCell>
                          <TableCell>
                            {format(new Date(mapping.startDate), 'dd MMM yyyy')}
                          </TableCell>
                          <TableCell>
                            {mapping.endDate ? format(new Date(mapping.endDate), 'dd MMM yyyy') : '-'}
                          </TableCell>
                          <TableCell>
                            {mapping.endDate ? (
                              <Chip label="Ended" color="error" size="small" />
                            ) : (
                              <Chip label="Active" color="success" size="small" />
                            )}
                          </TableCell>
                          {hasEditPermission && (
                            <TableCell align="right">
                              {!mapping.endDate && (
                                <Tooltip title="Edit Assignment">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleEditMapping(mapping)}
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </TableCell>
                          )}
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

      {/* Edit Client Dialog */}
      <Dialog 
        open={openEditDialog} 
        onClose={() => setOpenEditDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6">Edit Client</Typography>
        </Box>
        <Divider />
        <Box sx={{ p: 3 }}>
          <ClientForm clientId={id} onSave={handleEditSave} />
        </Box>
      </Dialog>
      
      {/* Employee Mapping Dialog */}
      <Dialog
        open={openMappingDialog}
        onClose={() => !isSavingMapping && setOpenMappingDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingMappingId ? 'Edit Employee Assignment' : 'New Employee Assignment'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControl fullWidth error={!!mappingErrors.role} disabled={!!editingMappingId}>
                  <InputLabel id="role-label">Role</InputLabel>
                  <Select
                    labelId="role-label"
                    name="role"
                    value={mappingFormData.role}
                    onChange={handleMappingChange}
                    label="Role"
                  >
                    <MenuItem value="kam">Key Account Manager (KAM)</MenuItem>
                    <MenuItem value="os">Overall Success Manager (OS)</MenuItem>
                    <MenuItem value="rs">Relationship Success Manager (RS)</MenuItem>
                  </Select>
                  {mappingErrors.role && <FormHelperText>{mappingErrors.role}</FormHelperText>}
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <FormControl fullWidth error={!!mappingErrors.employeeId}>
                  <InputLabel id="employee-label">Employee</InputLabel>
                  <Select
                    labelId="employee-label"
                    name="employeeId"
                    value={mappingFormData.employeeId}
                    onChange={handleMappingChange}
                    label="Employee"
                  >
                    {getAvailableEmployees(mappingFormData.role).map((employee) => (
                      <MenuItem key={employee.id} value={employee.id}>
                        {employee.name} ({employee.employeeId})
                      </MenuItem>
                    ))}
                  </Select>
                  {mappingErrors.employeeId && <FormHelperText>{mappingErrors.employeeId}</FormHelperText>}
                  {getAvailableEmployees(mappingFormData.role).length === 0 && (
                    <FormHelperText>
                      No available employees with this role. {' '}
                      {mappingFormData.role === 'kam' && activeKAM && 'Current KAM must be ended first.'}
                      {mappingFormData.role === 'os' && activeOS && 'Current OS must be ended first.'}
                      {mappingFormData.role === 'rs' && activeRS && 'Current RS must be ended first.'}
                    </FormHelperText>
                  )}
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Start Date"
                    value={startDate}
                    onChange={(date) => handleDateChange(date, 'startDate')}
                    disabled={!!editingMappingId}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true,
                        error: !!mappingErrors.startDate,
                        helperText: mappingErrors.startDate,
                      },
                    }}
                  />
                </LocalizationProvider>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="End Date (Optional)"
                    value={endDate}
                    onChange={(date) => handleDateChange(date, 'endDate')}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: !!mappingErrors.endDate,
                        helperText: mappingErrors.endDate,
                      },
                    }}
                  />
                </LocalizationProvider>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenMappingDialog(false)} disabled={isSavingMapping}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveMapping}
            variant="contained"
            disabled={isSavingMapping || getAvailableEmployees(mappingFormData.role).length === 0}
            startIcon={isSavingMapping ? <CircularProgress size={20} /> : undefined}
          >
            {isSavingMapping ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default ClientDetail
