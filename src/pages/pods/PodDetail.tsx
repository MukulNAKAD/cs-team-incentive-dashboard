import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Paper,
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  Chip,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import {
  Groups as GroupsIcon,
  Edit as EditIcon,
  ArrowBack as BackIcon,
  Person as PersonIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  BarChart as CostIcon,
} from '@mui/icons-material'
import { format, isAfter } from 'date-fns'
import { 
  getPodById, 
  updatePod, 
  getPodMembers, 
  addPodMember, 
  updatePodMember,
  removePodMember,
  getAllEmployees,
  getPodCosts
} from '../../api'
import { 
  PodDetail as PodDetailType, 
  Pod, 
  PodMember, 
  CreatePodMemberDto,
  UpdatePodMemberDto,
  Employee,
  PodCost,
  EmployeeCost
} from '../../types/api'
import PageHeader from '../../components/PageHeader'
import { useAuth } from '../../contexts/AuthContext'

interface MemberFormData {
  employeeId: string
  attributionPercentage: number
  podJoiningDate: string
  podLeavingDate?: string
}

interface MemberFormErrors {
  employeeId?: string
  attributionPercentage?: string
  podJoiningDate?: string
  podLeavingDate?: string
}

const PodDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const theme = useTheme()
  const { user } = useAuth()
  const [pod, setPod] = useState<PodDetailType | null>(null)
  const [members, setMembers] = useState<PodMember[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [podCost, setPodCost] = useState<PodCost | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCostLoading, setIsCostLoading] = useState(true)
  const [openEditDialog, setOpenEditDialog] = useState(false)
  const [openMemberDialog, setOpenMemberDialog] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [costError, setCostError] = useState<string | null>(null)
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null)
  const [memberFormData, setMemberFormData] = useState<MemberFormData>({
    employeeId: '',
    attributionPercentage: 100,
    podJoiningDate: new Date().toISOString().split('T')[0],
  })
  const [memberErrors, setMemberErrors] = useState<MemberFormErrors>({})
  const [joiningDate, setJoiningDate] = useState<Date | null>(new Date())
  const [leavingDate, setLeavingDate] = useState<Date | null>(null)
  const [isSavingMember, setIsSavingMember] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [memberToDelete, setMemberToDelete] = useState<PodMember | null>(null)
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1)
  
  // Check if user has permission to edit
  const isAdmin = user?.role === 'admin'
  const isKAM = user?.role === 'kam'
  const hasEditPermission = isAdmin || (isKAM && pod?.kam.id === user?.employee.id)

  useEffect(() => {
    const fetchPodData = async () => {
      if (!id) return
      
      setIsLoading(true)
      setError(null)
      
      try {
        const [podData, membersData, employeesData] = await Promise.all([
          getPodById(id),
          getPodMembers(id),
          getAllEmployees()
        ])
        
        setPod(podData)
        setMembers(membersData)
        setEmployees(employeesData)
      } catch (error: any) {
        console.error('Error fetching pod data:', error)
        setError(error.message || 'Failed to load pod data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchPodData()
  }, [id])

  // Fetch pod cost data when year/month changes
  useEffect(() => {
    const fetchPodCost = async () => {
      if (!id) return
      
      setIsCostLoading(true)
      setCostError(null)
      
      try {
        const costs = await getPodCosts(selectedYear, selectedMonth)
        const currentPodCost = costs.find(cost => cost.podId === id) || null
        setPodCost(currentPodCost)
      } catch (error: any) {
        console.error('Error fetching pod cost data:', error)
        setCostError(error.message || 'Failed to load cost data')
      } finally {
        setIsCostLoading(false)
      }
    }

    if (!isLoading && pod) {
      fetchPodCost()
    }
  }, [id, selectedYear, selectedMonth, isLoading, pod])

  // Handle member form input changes
  const handleMemberChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target
    if (name) {
      setMemberFormData((prev) => ({
        ...prev,
        [name]: value,
      }))
    }
  }

  // Handle date changes
  const handleDateChange = (date: Date | null, field: string) => {
    if (field === 'podJoiningDate') {
      setJoiningDate(date)
      if (date) {
        setMemberFormData((prev) => ({
          ...prev,
          podJoiningDate: date.toISOString().split('T')[0],
        }))
      }
    } else if (field === 'podLeavingDate') {
      setLeavingDate(date)
      if (date) {
        setMemberFormData((prev) => ({
          ...prev,
          podLeavingDate: date.toISOString().split('T')[0],
        }))
      } else {
        setMemberFormData((prev) => {
          const newData = { ...prev }
          delete newData.podLeavingDate
          return newData
        })
      }
    }
  }

  // Validate member form
  const validateMemberForm = (): boolean => {
    const newErrors: MemberFormErrors = {}

    if (!memberFormData.employeeId) {
      newErrors.employeeId = 'Employee is required'
    }

    if (memberFormData.attributionPercentage <= 0 || memberFormData.attributionPercentage > 100) {
      newErrors.attributionPercentage = 'Attribution percentage must be between 1-100'
    }

    if (!memberFormData.podJoiningDate) {
      newErrors.podJoiningDate = 'Joining date is required'
    }

    // Leaving date should be after joining date
    if (
      memberFormData.podJoiningDate &&
      memberFormData.podLeavingDate &&
      new Date(memberFormData.podJoiningDate) >= new Date(memberFormData.podLeavingDate)
    ) {
      newErrors.podLeavingDate = 'Leaving date should be after joining date'
    }

    setMemberErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Reset member form
  const resetMemberForm = () => {
    setMemberFormData({
      employeeId: '',
      attributionPercentage: 100,
      podJoiningDate: new Date().toISOString().split('T')[0],
    })
    setJoiningDate(new Date())
    setLeavingDate(null)
    setEditingMemberId(null)
    setMemberErrors({})
  }

  // Open member dialog for editing
  const handleEditMember = (member: PodMember) => {
    setEditingMemberId(member.id)
    setMemberFormData({
      employeeId: member.employee.id,
      attributionPercentage: member.attributionPercentage,
      podJoiningDate: member.podJoiningDate,
      podLeavingDate: member.podLeavingDate || undefined,
    })
    setJoiningDate(new Date(member.podJoiningDate))
    setLeavingDate(member.podLeavingDate ? new Date(member.podLeavingDate) : null)
    setOpenMemberDialog(true)
  }

  // Handle member deletion
  const handleDeleteClick = (member: PodMember) => {
    setMemberToDelete(member)
    setDeleteConfirmOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (memberToDelete) {
      try {
        await removePodMember(memberToDelete.id)
        setMembers(members.filter(m => m.id !== memberToDelete.id))
        setDeleteConfirmOpen(false)
        setMemberToDelete(null)
      } catch (error) {
        console.error('Error removing pod member:', error)
      }
    }
  }

  // Handle member form submission
  const handleSaveMember = async () => {
    if (!validateMemberForm() || !id) return

    setIsSavingMember(true)

    try {
      if (editingMemberId) {
        // Update existing member
        const updateData: UpdatePodMemberDto = {
          attributionPercentage: memberFormData.attributionPercentage,
          podLeavingDate: memberFormData.podLeavingDate,
        }
        
        await updatePodMember(editingMemberId, updateData)
      } else {
        // Add new member
        const createData: CreatePodMemberDto = {
          podId: id,
          employeeId: memberFormData.employeeId,
          attributionPercentage: memberFormData.attributionPercentage,
          podJoiningDate: memberFormData.podJoiningDate,
          podLeavingDate: memberFormData.podLeavingDate,
        }
        
        await addPodMember(createData)
      }
      
      // Refresh members
      const updatedMembers = await getPodMembers(id)
      setMembers(updatedMembers)
      
      setOpenMemberDialog(false)
      resetMemberForm()
    } catch (error: any) {
      console.error('Error saving pod member:', error)
    } finally {
      setIsSavingMember(false)
    }
  }

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

  // Helper function to get years array (current year and previous 2 years)
  const getYears = () => {
    const currentYear = new Date().getFullYear()
    return [
      { value: currentYear, label: currentYear.toString() },
      { value: currentYear - 1, label: (currentYear - 1).toString() },
      { value: currentYear - 2, label: (currentYear - 2).toString() },
    ]
  }

  // Helper to filter available employees
  const getAvailableEmployees = () => {
    return employees.filter(emp => {
      // If editing, allow current employee
      if (editingMemberId) {
        const currentMember = members.find(m => m.id === editingMemberId)
        if (currentMember && currentMember.employee.id === emp.id) return true
      }
      
      // Check if employee is already in the pod with no end date
      const isAlreadyInPod = members.some(m => 
        m.employee.id === emp.id && 
        !m.podLeavingDate &&
        (!editingMemberId || m.id !== editingMemberId) // Skip current member when editing
      )
      
      return !isAlreadyInPod
    })
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
          onClick={() => navigate('/pods')}
          sx={{ mt: 2 }}
        >
          Back to PODs
        </Button>
      </Box>
    )
  }

  if (!pod) {
    return (
      <Box sx={{ mt: 4 }}>
        <Alert severity="warning">POD not found</Alert>
        <Button 
          startIcon={<BackIcon />} 
          onClick={() => navigate('/pods')}
          sx={{ mt: 2 }}
        >
          Back to PODs
        </Button>
      </Box>
    )
  }

  // Get active members (no end date or end date in the future)
  const activeMembers = members.filter(m => !m.podLeavingDate || isAfter(new Date(m.podLeavingDate), new Date()))
  const inactiveMembers = members.filter(m => m.podLeavingDate && !isAfter(new Date(m.podLeavingDate), new Date()))

  return (
    <Box>
      <PageHeader
        title="POD Details"
        breadcrumbs={[
          { title: 'Dashboard', path: '/dashboard' },
          { title: 'PODs', path: '/pods' },
          { title: pod.name },
        ]}
        action={
          hasEditPermission
            ? {
                label: 'Add Member',
                icon: <AddIcon />,
                onClick: () => {
                  resetMemberForm()
                  setOpenMemberDialog(true)
                },
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
                  {pod.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Managed by {pod.kam?.name || 'Not Assigned'}
                </Typography>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ '& > div': { mb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <PersonIcon sx={{ color: 'primary.main', mr: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Active Members
                  </Typography>
                  <Typography variant="body1" sx={{ ml: 'auto' }}>
                    {activeMembers.length}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <GroupsIcon sx={{ color: 'primary.main', mr: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Total Members
                  </Typography>
                  <Typography variant="body1" sx={{ ml: 'auto' }}>
                    {members.length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Cost Analysis
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <FormControl size="small" sx={{ minWidth: 100 }}>
                    <InputLabel id="month-label">Month</InputLabel>
                    <Select
                      labelId="month-label"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(Number(e.target.value))}
                      label="Month"
                    >
                      {getMonths().map(month => (
                        <MenuItem key={month.value} value={month.value}>
                          {month.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  
                  <FormControl size="small" sx={{ minWidth: 90 }}>
                    <InputLabel id="year-label">Year</InputLabel>
                    <Select
                      labelId="year-label"
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
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
              
              <Divider sx={{ my: 2 }} />
              
              {isCostLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                  <CircularProgress size={30} />
                </Box>
              ) : costError ? (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {costError}
                </Alert>
              ) : !podCost ? (
                <Typography variant="body1" sx={{ textAlign: 'center', py: 2 }}>
                  No cost data available for this period.
                </Typography>
              ) : (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="subtitle1">Total POD Cost:</Typography>
                    <Typography variant="h6" color="error">
                      ₹{podCost.totalCost.toLocaleString()}
                    </Typography>
                  </Box>
                  
                  <Typography variant="subtitle2" gutterBottom>
                    Cost Breakdown by Member:
                  </Typography>
                  
                  {podCost.members.length === 0 ? (
                    <Typography variant="body2" sx={{ textAlign: 'center', py: 1 }}>
                      No member costs for this period.
                    </Typography>
                  ) : (
                    <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Employee</TableCell>
                            <TableCell align="right">Cost</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {podCost.members.map((memberCost) => (
                            <TableRow key={memberCost.employeeId}>
                              <TableCell>
                                {memberCost.employeeName}
                              </TableCell>
                              <TableCell align="right">
                                ₹{memberCost.adjustedCost.toLocaleString()}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Paper sx={{ width: '100%', p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">Active Members</Typography>
            </Box>
            
            {activeMembers.length === 0 ? (
              <Typography variant="body1" sx={{ p: 2, textAlign: 'center' }}>
                No active members in this POD.
              </Typography>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Employee</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Attribution %</TableCell>
                      <TableCell>Joined On</TableCell>
                      <TableCell>End Date</TableCell>
                      {hasEditPermission && <TableCell align="right">Actions</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {activeMembers.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="body1">
                              {member.employee.name}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={member.employee.designation.toUpperCase()} 
                            color={
                              member.employee.designation === 'kam'
                                ? 'primary'
                                : member.employee.designation === 'os'
                                ? 'success'
                                : 'info'
                            } 
                            size="small" 
                          />
                        </TableCell>
                        <TableCell>{member.attributionPercentage}%</TableCell>
                        <TableCell>
                          {format(new Date(member.podJoiningDate), 'dd MMM yyyy')}
                        </TableCell>
                        <TableCell>
                          {member.podLeavingDate ? 
                            format(new Date(member.podLeavingDate), 'dd MMM yyyy') : 
                            'Active'
                          }
                        </TableCell>
                        {hasEditPermission && (
                          <TableCell align="right">
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                              <Tooltip title="Edit Member">
                                <IconButton
                                  size="small"
                                  onClick={() => handleEditMember(member)}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Remove Member">
                                <IconButton
                                  size="small"
                                  onClick={() => handleDeleteClick(member)}
                                  color="error"
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
            
            {inactiveMembers.length > 0 && (
              <>
                <Box sx={{ mt: 5, mb: 3 }}>
                  <Typography variant="h6">Former Members</Typography>
                </Box>
                
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Employee</TableCell>
                        <TableCell>Role</TableCell>
                        <TableCell>Attribution %</TableCell>
                        <TableCell>Joined On</TableCell>
                        <TableCell>Left On</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {inactiveMembers.map((member) => (
                        <TableRow key={member.id}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Typography variant="body1">
                                {member.employee.name}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={member.employee.designation.toUpperCase()} 
                              color={
                                member.employee.designation === 'kam'
                                  ? 'primary'
                                  : member.employee.designation === 'os'
                                  ? 'success'
                                  : 'info'
                              } 
                              size="small" 
                            />
                          </TableCell>
                          <TableCell>{member.attributionPercentage}%</TableCell>
                          <TableCell>
                            {format(new Date(member.podJoiningDate), 'dd MMM yyyy')}
                          </TableCell>
                          <TableCell>
                            {member.podLeavingDate && 
                              format(new Date(member.podLeavingDate), 'dd MMM yyyy')
                            }
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Add/Edit Member Dialog */}
      <Dialog 
        open={openMemberDialog} 
        onClose={() => !isSavingMember && setOpenMemberDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingMemberId ? 'Edit POD Member' : 'Add POD Member'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControl fullWidth error={!!memberErrors.employeeId} disabled={!!editingMemberId}>
                  <InputLabel id="employee-label">Employee</InputLabel>
                  <Select
                    labelId="employee-label"
                    name="employeeId"
                    value={memberFormData.employeeId}
                    onChange={handleMemberChange}
                    label="Employee"
                  >
                    {getAvailableEmployees().map((employee) => (
                      <MenuItem key={employee.id} value={employee.id}>
                        {employee.name} ({employee.designation.toUpperCase()})
                      </MenuItem>
                    ))}
                  </Select>
                  {memberErrors.employeeId && <FormHelperText>{memberErrors.employeeId}</FormHelperText>}
                  {getAvailableEmployees().length === 0 && !editingMemberId && (
                    <FormHelperText>
                      No available employees to add to this POD. Employees may already be active in the POD.
                    </FormHelperText>
                  )}
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  name="attributionPercentage"
                  label="Attribution Percentage"
                  type="number"
                  value={memberFormData.attributionPercentage}
                  onChange={handleMemberChange}
                  fullWidth
                  inputProps={{ min: 1, max: 100 }}
                  error={!!memberErrors.attributionPercentage}
                  helperText={memberErrors.attributionPercentage}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="POD Joining Date"
                    value={joiningDate}
                    onChange={(date) => handleDateChange(date, 'podJoiningDate')}
                    disabled={!!editingMemberId}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true,
                        error: !!memberErrors.podJoiningDate,
                        helperText: memberErrors.podJoiningDate,
                      },
                    }}
                  />
                </LocalizationProvider>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="POD Leaving Date (Optional)"
                    value={leavingDate}
                    onChange={(date) => handleDateChange(date, 'podLeavingDate')}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: !!memberErrors.podLeavingDate,
                        helperText: memberErrors.podLeavingDate,
                      },
                    }}
                  />
                </LocalizationProvider>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenMemberDialog(false)} disabled={isSavingMember}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveMember}
            variant="contained"
            disabled={isSavingMember || (getAvailableEmployees().length === 0 && !editingMemberId)}
            startIcon={isSavingMember ? <CircularProgress size={20} /> : undefined}
          >
            {isSavingMember ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Confirm Member Removal</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to remove {memberToDelete?.employee.name} from this POD?
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default PodDetail
