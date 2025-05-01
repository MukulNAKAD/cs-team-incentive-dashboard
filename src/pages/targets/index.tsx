import { useState, useEffect } from 'react'
import {
  Box,
  Paper,
  Button,
  TextField,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  IconButton,
  Tooltip,
  Typography,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material'
import { 
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Upload as UploadIcon,
  Assessment as TargetIcon,
} from '@mui/icons-material'
import { useAuth } from '../../contexts/AuthContext'
import { 
  getTargetsByYearAndMonth, 
  getAllEmployees, 
  createTarget,
  bulkCreateTargets,
  updateTarget,
  deleteTarget,
  importTargets
} from '../../api'
import { Target, Employee, CreateTargetDto, BulkCreateTargetDto } from '../../types/api'
import PageHeader from '../../components/PageHeader'

interface FormData {
  employeeId: string
  year: number
  month: number
  type: 'revenue' | 'gm'
  value: number
}

interface FormErrors {
  employeeId?: string
  type?: string
  value?: string
}

const TargetsPage = () => {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const hasEditPermission = isAdmin
  
  const [targets, setTargets] = useState<Target[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [openBulkDialog, setOpenBulkDialog] = useState(false)
  const [openImportDialog, setOpenImportDialog] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    employeeId: '',
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    type: 'revenue',
    value: 0,
  })
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [bulkTargets, setBulkTargets] = useState<Map<string, number>>(new Map())
  const [bulkType, setBulkType] = useState<'revenue' | 'gm'>('revenue')
  const [year, setYear] = useState<number>(new Date().getFullYear())
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1)

  // Fetch targets for current period and employees
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        
        const [targetsData, employeesData] = await Promise.all([
          getTargetsByYearAndMonth(year, month),
          getAllEmployees()
        ])
        
        setTargets(targetsData)
        setEmployees(employeesData)
      } catch (error) {
        console.error('Error fetching targets data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [year, month])

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

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target
    if (name) {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }))
    }
  }

  // Handle bulk form input changes
  const handleBulkChange = (employeeId: string, value: number) => {
    const newTargets = new Map(bulkTargets)
    newTargets.set(employeeId, value)
    setBulkTargets(newTargets)
  }

  // Open edit dialog for a target
  const handleEditClick = (target: Target) => {
    setSelectedTargetId(target.id)
    setFormData({
      employeeId: target.employee.id,
      year: target.year,
      month: target.month,
      type: target.type,
      value: target.value,
    })
    setOpenDialog(true)
  }

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.employeeId) {
      newErrors.employeeId = 'Employee is required'
    }

    if (!formData.type) {
      newErrors.type = 'Target type is required'
    }

    if (formData.value <= 0) {
      newErrors.value = 'Target value must be greater than 0'
    }

    setFormErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      if (selectedTargetId) {
        // Update existing target
        await updateTarget(selectedTargetId, {
          value: formData.value,
        })
      } else {
        // Create new target
        const createData: CreateTargetDto = {
          employeeId: formData.employeeId,
          year: formData.year,
          month: formData.month,
          type: formData.type,
          value: formData.value,
        }
        
        await createTarget(createData)
      }
      
      // Refresh targets
      const updatedTargets = await getTargetsByYearAndMonth(year, month)
      setTargets(updatedTargets)
      
      setOpenDialog(false)
      resetForm()
    } catch (error: any) {
      setError(error.message || 'Failed to save target')
    } finally {
      setIsSaving(false)
    }
  }

  // Handle bulk target submission
  const handleBulkSubmit = async () => {
    setIsSaving(true)
    setError(null)

    try {
      // Prepare bulk targets data
      const targetsData: CreateTargetDto[] = []
      
      bulkTargets.forEach((value, employeeId) => {
        if (value > 0) {
          targetsData.push({
            employeeId,
            year,
            month,
            type: bulkType,
            value,
          })
        }
      })
      
      if (targetsData.length === 0) {
        setError('No valid targets to save')
        setIsSaving(false)
        return
      }
      
      // Create bulk targets
      const bulkData: BulkCreateTargetDto = {
        targets: targetsData,
      }
      
      await bulkCreateTargets(bulkData)
      
      // Refresh targets
      const updatedTargets = await getTargetsByYearAndMonth(year, month)
      setTargets(updatedTargets)
      
      setOpenBulkDialog(false)
      setBulkTargets(new Map())
    } catch (error: any) {
      setError(error.message || 'Failed to save targets')
    } finally {
      setIsSaving(false)
    }
  }

  // Handle file import
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0])
    }
  }

  const handleImport = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    setImportError(null)

    try {
      const result = await importTargets(selectedFile)
      if (result.failed > 0) {
        setImportError(`Imported ${result.success} records with ${result.failed} failures.`)
      } else {
        setOpenImportDialog(false)
        // Refresh targets
        const updatedTargets = await getTargetsByYearAndMonth(year, month)
        setTargets(updatedTargets)
      }
    } catch (error: any) {
      setImportError(error.message || 'Error importing file')
    } finally {
      setIsUploading(false)
    }
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      employeeId: '',
      year,
      month,
      type: 'revenue',
      value: 0,
    })
    setFormErrors({})
    setSelectedTargetId(null)
  }

  // Handle delete target
  const handleDeleteTarget = async (targetId: string) => {
    try {
      await deleteTarget(targetId)
      
      // Refresh targets
      const updatedTargets = await getTargetsByYearAndMonth(year, month)
      setTargets(updatedTargets)
    } catch (error) {
      console.error('Error deleting target:', error)
    }
  }

  // Filter employees by designation for bulk form
  const getEmployeesByDesignation = (designation: 'kam' | 'os' | 'rs') => {
    return employees.filter(emp => emp.designation === designation)
  }

  // Get existing target for an employee and type
  const getExistingTarget = (employeeId: string, type: 'revenue' | 'gm') => {
    return targets.find(target => 
      target.employee.id === employeeId && 
      target.type === type &&
      target.year === year &&
      target.month === month
    )
  }

  if (!hasEditPermission) {
    return (
      <Box>
        <PageHeader
          title="Targets"
          subtitle="Set and manage employee performance targets"
          breadcrumbs={[
            { title: 'Dashboard', path: '/dashboard' },
            { title: 'Targets' },
          ]}
        />
        
        <Alert severity="warning" sx={{ mb: 3 }}>
          You don't have permission to access this page. Only admins can manage targets.
        </Alert>
      </Box>
    )
  }

  return (
    <Box>
      <PageHeader
        title="Targets"
        subtitle="Set and manage employee performance targets"
        breadcrumbs={[
          { title: 'Dashboard', path: '/dashboard' },
          { title: 'Targets' },
        ]}
        action={{
          label: 'Set Bulk Targets',
          icon: <AddIcon />,
          onClick: () => setOpenBulkDialog(true),
        }}
      />

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={4}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
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
              
              <FormControl size="small" sx={{ minWidth: 100 }}>
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
          </Grid>
          
          <Grid item xs={12} sm={6} md={8} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => {
                resetForm()
                setOpenDialog(true)
              }}
              sx={{ mr: 1 }}
            >
              Add Individual Target
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<UploadIcon />}
              onClick={() => setOpenImportDialog(true)}
            >
              Import Targets
            </Button>
          </Grid>
        </Grid>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Typography variant="h6" gutterBottom>
              Revenue Targets for {getMonths().find(m => m.value === month)?.label} {year}
            </Typography>
            
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 4 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Employee</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell align="right">Target Amount</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {targets
                    .filter(target => target.type === 'revenue')
                    .map((target) => (
                      <TableRow key={target.id}>
                        <TableCell>{target.employee.name}</TableCell>
                        <TableCell>
                          <Chip 
                            label={target.employee.designation.toUpperCase()} 
                            color={
                              target.employee.designation === 'kam'
                                ? 'primary'
                                : target.employee.designation === 'os'
                                ? 'success'
                                : 'info'
                            } 
                            size="small" 
                          />
                        </TableCell>
                        <TableCell align="right">₹{target.value.toLocaleString()}</TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                            <Tooltip title="Edit Target">
                              <IconButton size="small" onClick={() => handleEditClick(target)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Target">
                              <IconButton 
                                size="small" 
                                color="error" 
                                onClick={() => handleDeleteTarget(target.id)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  {targets.filter(target => target.type === 'revenue').length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        No revenue targets set for this period.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            
            <Typography variant="h6" gutterBottom>
              Gross Margin (GM) Targets for {getMonths().find(m => m.value === month)?.label} {year}
            </Typography>
            
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Employee</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell align="right">Target GM</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {targets
                    .filter(target => target.type === 'gm')
                    .map((target) => (
                      <TableRow key={target.id}>
                        <TableCell>{target.employee.name}</TableCell>
                        <TableCell>
                          <Chip 
                            label={target.employee.designation.toUpperCase()} 
                            color={
                              target.employee.designation === 'kam'
                                ? 'primary'
                                : target.employee.designation === 'os'
                                ? 'success'
                                : 'info'
                            } 
                            size="small" 
                          />
                        </TableCell>
                        <TableCell align="right">{target.value.toFixed(2)}</TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                            <Tooltip title="Edit Target">
                              <IconButton size="small" onClick={() => handleEditClick(target)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Target">
                              <IconButton 
                                size="small" 
                                color="error" 
                                onClick={() => handleDeleteTarget(target.id)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  {targets.filter(target => target.type === 'gm').length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        No GM targets set for this period.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </Paper>

      {/* Add/Edit Target Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={() => !isSaving && setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedTargetId ? 'Edit Target' : 'Add New Target'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}
            
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControl fullWidth error={!!formErrors.employeeId} disabled={!!selectedTargetId}>
                  <InputLabel id="employee-label">Employee</InputLabel>
                  <Select
                    labelId="employee-label"
                    name="employeeId"
                    value={formData.employeeId}
                    onChange={handleChange}
                    label="Employee"
                  >
                    {employees.map((employee) => (
                      <MenuItem key={employee.id} value={employee.id}>
                        {employee.name} ({employee.designation.toUpperCase()})
                      </MenuItem>
                    ))}
                  </Select>
                  {formErrors.employeeId && <Typography color="error" variant="caption">{formErrors.employeeId}</Typography>}
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth disabled={!!selectedTargetId}>
                  <InputLabel id="type-label">Target Type</InputLabel>
                  <Select
                    labelId="type-label"
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    label="Target Type"
                  >
                    <MenuItem value="revenue">Revenue</MenuItem>
                    <MenuItem value="gm">Gross Margin (GM)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  name="value"
                  label={formData.type === 'revenue' ? 'Target Amount' : 'Target GM'}
                  type="number"
                  value={formData.value}
                  onChange={handleChange}
                  fullWidth
                  inputProps={{ 
                    min: 0,
                    step: formData.type === 'revenue' ? 1000 : 0.01
                  }}
                  error={!!formErrors.value}
                  helperText={formErrors.value}
                />
              </Grid>
              
              {!selectedTargetId && (
                <>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel id="month-label-form">Month</InputLabel>
                      <Select
                        labelId="month-label-form"
                        name="month"
                        value={formData.month}
                        onChange={handleChange}
                        label="Month"
                      >
                        {getMonths().map(month => (
                          <MenuItem key={month.value} value={month.value}>
                            {month.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel id="year-label-form">Year</InputLabel>
                      <Select
                        labelId="year-label-form"
                        name="year"
                        value={formData.year}
                        onChange={handleChange}
                        label="Year"
                      >
                        {getYears().map(year => (
                          <MenuItem key={year.value} value={year.value}>
                            {year.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </>
              )}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={isSaving}
            startIcon={isSaving ? <CircularProgress size={20} /> : undefined}
          >
            {isSaving ? 'Saving...' : 'Save Target'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Bulk Target Dialog */}
      <Dialog 
        open={openBulkDialog} 
        onClose={() => !isSaving && setOpenBulkDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Set Bulk Targets for {getMonths().find(m => m.value === month)?.label} {year}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}
            
            <Box sx={{ mb: 3 }}>
              <FormControl fullWidth>
                <InputLabel id="bulk-type-label">Target Type</InputLabel>
                <Select
                  labelId="bulk-type-label"
                  value={bulkType}
                  onChange={(e) => setBulkType(e.target.value as 'revenue' | 'gm')}
                  label="Target Type"
                >
                  <MenuItem value="revenue">Revenue</MenuItem>
                  <MenuItem value="gm">Gross Margin (GM)</MenuItem>
                </Select>
              </FormControl>
            </Box>
            
            <Typography variant="h6" gutterBottom>
              Key Account Managers (KAM)
            </Typography>
            
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Employee</TableCell>
                    <TableCell>Current Target</TableCell>
                    <TableCell>New Target</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {getEmployeesByDesignation('kam').map((employee) => {
                    const existingTarget = getExistingTarget(employee.id, bulkType)
                    const currentTarget = bulkTargets.get(employee.id)
                    
                    return (
                      <TableRow key={employee.id}>
                        <TableCell>{employee.name}</TableCell>
                        <TableCell>
                          {existingTarget ? 
                            bulkType === 'revenue' ? 
                              `₹${existingTarget.value.toLocaleString()}` : 
                              existingTarget.value.toFixed(2)
                            : 'Not set'
                          }
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            value={currentTarget || ''}
                            onChange={(e) => handleBulkChange(employee.id, Number(e.target.value))}
                            inputProps={{ 
                              min: 0,
                              step: bulkType === 'revenue' ? 1000 : 0.01
                            }}
                            size="small"
                            placeholder={existingTarget ? existingTarget.value.toString() : '0'}
                            fullWidth
                          />
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {getEmployeesByDesignation('kam').length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} align="center">
                        No KAM employees found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            
            {bulkType === 'revenue' && (
              <>
                <Typography variant="h6" gutterBottom>
                  Relationship Success Managers (RS)
                </Typography>
                
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Employee</TableCell>
                        <TableCell>Current Target</TableCell>
                        <TableCell>New Target</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {getEmployeesByDesignation('rs').map((employee) => {
                        const existingTarget = getExistingTarget(employee.id, bulkType)
                        const currentTarget = bulkTargets.get(employee.id)
                        
                        return (
                          <TableRow key={employee.id}>
                            <TableCell>{employee.name}</TableCell>
                            <TableCell>
                              {existingTarget ? 
                                `₹${existingTarget.value.toLocaleString()}` : 
                                'Not set'
                              }
                            </TableCell>
                            <TableCell>
                              <TextField
                                type="number"
                                value={currentTarget || ''}
                                onChange={(e) => handleBulkChange(employee.id, Number(e.target.value))}
                                inputProps={{ 
                                  min: 0,
                                  step: 1000
                                }}
                                size="small"
                                placeholder={existingTarget ? existingTarget.value.toString() : '0'}
                                fullWidth
                              />
                            </TableCell>
                          </TableRow>
                        )
                      })}
                      {getEmployeesByDesignation('rs').length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} align="center">
                            No RS employees found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenBulkDialog(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            onClick={handleBulkSubmit}
            variant="contained"
            disabled={isSaving || bulkTargets.size === 0}
            startIcon={isSaving ? <CircularProgress size={20} /> : undefined}
          >
            {isSaving ? 'Saving...' : 'Save All Targets'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Import Dialog */}
      <Dialog
        open={openImportDialog}
        onClose={() => !isUploading && setOpenImportDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Import Targets from Excel</DialogTitle>
        <DialogContent>
          <Box sx={{ py: 2 }}>
            <Typography variant="body1" gutterBottom>
              Upload an Excel file with target data to bulk import records.
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              The file should include: Employee ID, Year, Month, Type (revenue/gm), and Value.
            </Typography>
            <Box sx={{ mt: 3 }}>
              <Button
                variant="outlined"
                component="label"
                disabled={isUploading}
                fullWidth
              >
                Select File
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  hidden
                  onChange={handleFileChange}
                />
              </Button>
              {selectedFile && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Selected file: {selectedFile.name}
                </Typography>
              )}
              {importError && (
                <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                  {importError}
                </Typography>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenImportDialog(false)} disabled={isUploading}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            variant="contained"
            disabled={!selectedFile || isUploading}
            startIcon={isUploading ? <CircularProgress size={20} /> : undefined}
          >
            {isUploading ? 'Importing...' : 'Import'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default TargetsPage
