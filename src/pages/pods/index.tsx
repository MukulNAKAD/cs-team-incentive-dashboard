import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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
} from '@mui/material'
import { 
  DataGrid, 
  GridColDef, 
  GridRenderCellParams,
  GridToolbar,
} from '@mui/x-data-grid'
import { 
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Groups as GroupsIcon,
  Person as PersonIcon,
} from '@mui/icons-material'
import { useAuth } from '../../contexts/AuthContext'
import { getAllPods, deletePod, getAllEmployees, createPod, updatePod, getPodMembers } from '../../api'
import { Pod, Employee, PodMember } from '../../types/api'
import PageHeader from '../../components/PageHeader'

interface PodFormData {
  name: string
  kamId: string
}

interface PodFormErrors {
  name?: string
  kamId?: string
}

const Pods = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [pods, setPods] = useState<Pod[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [selectedPodId, setSelectedPodId] = useState<string | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [podToDelete, setPodToDelete] = useState<Pod | null>(null)
  const [formData, setFormData] = useState<PodFormData>({
    name: '',
    kamId: '',
  })
  const [formErrors, setFormErrors] = useState<PodFormErrors>({})
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [podMembers, setPodMembers] = useState<{[key: string]: number}>({})

  // Check if user has admin or KAM rights
  const isAdmin = user?.role === 'admin'
  const isKAM = user?.role === 'kam'
  const hasEditPermission = isAdmin || isKAM
  const isCurrentUserKam = (kamId: string) => {
    return user?.employee.id === kamId
  }

  // Fetch pods data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        
        let podsData: Pod[]
        const employeesData = await getAllEmployees()
        
        if (isAdmin) {
          // Admin can see all pods
          podsData = await getAllPods()
        } else if (isKAM && user?.employee?.id) {
          // KAM can see only their pods
          podsData = await getAllPods() // In a real app, you'd filter by KAM ID on the backend
          podsData = podsData.filter(pod => pod.kam.id === user.employee.id)
        } else {
          podsData = []
        }
        
        setPods(podsData)
        setEmployees(employeesData)
        
        // Fetch member counts for each pod
        const memberCounts: {[key: string]: number} = {}
        for (const pod of podsData) {
          try {
            const members = await getPodMembers(pod.id)
            memberCounts[pod.id] = members.length
          } catch (error) {
            console.error(`Error fetching members for pod ${pod.id}:`, error)
            memberCounts[pod.id] = 0
          }
        }
        setPodMembers(memberCounts)
      } catch (error) {
        console.error('Error fetching pods:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [isAdmin, isKAM, user?.employee?.id])

  // Handle pod deletion
  const handleDeleteClick = (pod: Pod) => {
    setPodToDelete(pod)
    setDeleteConfirmOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (podToDelete) {
      try {
        await deletePod(podToDelete.id)
        setPods(pods.filter((p) => p.id !== podToDelete.id))
        setDeleteConfirmOpen(false)
        setPodToDelete(null)
      } catch (error) {
        console.error('Error deleting pod:', error)
      }
    }
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

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: PodFormErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'POD name is required'
    }

    if (!formData.kamId) {
      newErrors.kamId = 'Key Account Manager is required'
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
      if (selectedPodId) {
        // Update existing pod
        await updatePod(selectedPodId, formData)
      } else {
        // Create new pod
        await createPod(formData)
      }
      
      // Refresh pods list
      let updatedPods: Pod[]
      if (isAdmin) {
        updatedPods = await getAllPods()
      } else if (isKAM && user?.employee?.id) {
        updatedPods = await getAllPods()
        updatedPods = updatedPods.filter(pod => pod.kam.id === user.employee.id)
      } else {
        updatedPods = []
      }
      setPods(updatedPods)
      
      setOpenDialog(false)
      resetForm()
    } catch (error: any) {
      setError(error.message || 'Failed to save POD')
    } finally {
      setIsSaving(false)
    }
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      kamId: '',
    })
    setFormErrors({})
    setSelectedPodId(null)
  }

  // Handle edit pod
  const handleEditClick = async (pod: Pod) => {
    setSelectedPodId(pod.id)
    setFormData({
      name: pod.name,
      kamId: pod.kam.id,
    })
    setOpenDialog(true)
  }

  // Filter pods by search term
  const filteredPods = pods.filter((pod) => {
    return (
      pod.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      pod.kam.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  // Get KAM employees
  const kamEmployees = employees.filter(emp => emp.designation === 'kam')

  // DataGrid columns
  const columns: GridColDef[] = [
    { 
      field: 'name', 
      headerName: 'POD Name', 
      flex: 1.5,
      minWidth: 200 
    },
    { 
      field: 'kam', 
      headerName: 'Key Account Manager', 
      flex: 1.5,
      minWidth: 200,
      valueGetter: (params) => params.row.kam?.name || 'N/A'
    },
    { 
      field: 'memberCount', 
      headerName: 'Members', 
      flex: 0.8,
      minWidth: 100,
      valueGetter: (params) => podMembers[params.row.id] || 0,
      align: 'center',
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 1,
      minWidth: 120,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams<Pod>) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="View POD">
            <IconButton
              size="small"
              onClick={() => navigate(`/pods/${params.row.id}`)}
            >
              <GroupsIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          {(isAdmin || isCurrentUserKam(params.row.kam.id)) && (
            <Tooltip title="Edit POD">
              <IconButton
                size="small"
                onClick={() => handleEditClick(params.row)}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          
          {isAdmin && (
            <Tooltip title="Delete POD">
              <IconButton
                size="small"
                onClick={() => handleDeleteClick(params.row)}
                color="error"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      ),
    },
  ]

  return (
    <Box>
      <PageHeader
        title="PODs"
        subtitle="Manage PODs and team assignments"
        breadcrumbs={[
          { title: 'Dashboard', path: '/dashboard' },
          { title: 'PODs' },
        ]}
        action={
          hasEditPermission
            ? {
                label: 'Create POD',
                icon: <AddIcon />,
                onClick: () => {
                  resetForm()
                  if (isKAM && user?.employee?.id) {
                    // Pre-select current KAM
                    setFormData(prev => ({ ...prev, kamId: user.employee.id }))
                  }
                  setOpenDialog(true)
                },
              }
            : undefined
        }
      />

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search by POD name or KAM"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              size="small"
            />
          </Grid>
        </Grid>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <DataGrid
            rows={filteredPods}
            columns={columns}
            initialState={{
              pagination: {
                paginationModel: { page: 0, pageSize: 10 },
              },
              sorting: {
                sortModel: [{ field: 'name', sort: 'asc' }],
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
        )}
      </Paper>

      {/* Add/Edit POD Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={() => !isSaving && setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedPodId ? 'Edit POD' : 'Create New POD'}
        </DialogTitle>
        <Divider />
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}
            
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  name="name"
                  label="POD Name"
                  value={formData.name}
                  onChange={handleChange}
                  fullWidth
                  required
                  error={!!formErrors.name}
                  helperText={formErrors.name}
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControl fullWidth error={!!formErrors.kamId} disabled={isKAM && !isAdmin}>
                  <InputLabel id="kam-label">Key Account Manager</InputLabel>
                  <Select
                    labelId="kam-label"
                    name="kamId"
                    value={formData.kamId}
                    onChange={handleChange}
                    label="Key Account Manager"
                  >
                    {kamEmployees.map((employee) => (
                      <MenuItem key={employee.id} value={employee.id}>
                        {employee.name} ({employee.employeeId})
                      </MenuItem>
                    ))}
                  </Select>
                  {formErrors.kamId && <Typography color="error" variant="caption">{formErrors.kamId}</Typography>}
                </FormControl>
              </Grid>
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
            {isSaving ? 'Saving...' : selectedPodId ? 'Update POD' : 'Create POD'}
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
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete POD "{podToDelete?.name}"?
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            This action cannot be undone and will remove all member associations.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Pods
