import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Paper,
  Button,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Typography,
  Grid,
  MenuItem,
  TextField,
  InputAdornment,
} from '@mui/material'
import { 
  DataGrid, 
  GridColDef, 
  GridRenderCellParams,
  GridToolbar, 
  GridValueFormatterParams
} from '@mui/x-data-grid'
import { 
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Upload as UploadIcon,
  FilterList as FilterListIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon
} from '@mui/icons-material'
import { format } from 'date-fns'
import { useAuth } from '../../contexts/AuthContext'
import { getAllEmployees, deleteEmployee, importEmployees } from '../../api'
import { Employee } from '../../types/api'
import PageHeader from '../../components/PageHeader'
import EmployeeForm from './EmployeeForm'

const Employees = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [openImportDialog, setOpenImportDialog] = useState(false)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null)
  const [filterDesignation, setFilterDesignation] = useState<string>('all')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null)

  // Check if user has admin rights
  const isAdmin = user?.role === 'admin'
  const isKAM = user?.role === 'kam'
  const hasEditPermission = isAdmin

  // Fetch employees data
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setIsLoading(true)
        const data = await getAllEmployees()
        setEmployees(data)
      } catch (error) {
        console.error('Error fetching employees:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchEmployees()
  }, [])

  // Handle employee deletion
  const handleDeleteClick = (employee: Employee) => {
    setEmployeeToDelete(employee)
    setDeleteConfirmOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (employeeToDelete) {
      try {
        await deleteEmployee(employeeToDelete.id)
        setEmployees(employees.filter((emp) => emp.id !== employeeToDelete.id))
        setDeleteConfirmOpen(false)
        setEmployeeToDelete(null)
      } catch (error) {
        console.error('Error deleting employee:', error)
      }
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
      const result = await importEmployees(selectedFile)
      if (result.failed > 0) {
        setImportError(`Imported ${result.success} records with ${result.failed} failures.`)
      } else {
        setOpenImportDialog(false)
        // Refresh employee list
        const data = await getAllEmployees()
        setEmployees(data)
      }
    } catch (error: any) {
      setImportError(error.message || 'Error importing file')
    } finally {
      setIsUploading(false)
    }
  }

  // Filter and search employees
  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch = 
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (filterDesignation === 'all') {
      return matchesSearch
    } else {
      return matchesSearch && employee.designation === filterDesignation
    }
  })

  // DataGrid columns
  const columns: GridColDef[] = [
    { 
      field: 'employeeId', 
      headerName: 'Employee ID', 
      flex: 1,
      minWidth: 120 
    },
    { 
      field: 'name', 
      headerName: 'Name', 
      flex: 1.5,
      minWidth: 180 
    },
    { 
      field: 'designation', 
      headerName: 'Designation', 
      flex: 1,
      minWidth: 120,
      renderCell: (params: GridRenderCellParams<Employee>) => {
        const designation = params.row.designation.toUpperCase()
        let color = 'default'
        
        switch (designation) {
          case 'KAM':
            color = 'primary'
            break
          case 'OS':
            color = 'success'
            break
          case 'RS':
            color = 'info'
            break
          default:
            color = 'default'
        }
        
        return <Chip label={designation} color={color as any} size="small" />
      }
    },
    { 
      field: 'monthlyCost', 
      headerName: 'Monthly Cost', 
      flex: 1,
      minWidth: 130,
      valueFormatter: (params: GridValueFormatterParams<number>) => {
        return `₹${params.value.toLocaleString()}`
      } 
    },
    { 
      field: 'companyJoiningDate', 
      headerName: 'Joining Date', 
      flex: 1,
      minWidth: 120,
      valueFormatter: (params: GridValueFormatterParams<string>) => {
        return format(new Date(params.value), 'dd/MM/yyyy')
      }
    },
    { 
      field: 'status', 
      headerName: 'Status', 
      flex: 0.8,
      minWidth: 100,
      renderCell: (params: GridRenderCellParams<Employee>) => {
        const isNoticeOn = params.row.noticePeriodStart !== null
        return (
          <Chip 
            label={isNoticeOn ? 'Notice Period' : 'Active'} 
            color={isNoticeOn ? 'warning' : 'success'} 
            icon={isNoticeOn ? <InactiveIcon /> : <ActiveIcon />}
            size="small"
          />
        )
      }
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 1,
      minWidth: 120,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams<Employee>) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="View Details">
            <IconButton
              size="small"
              onClick={() => navigate(`/employees/${params.row.id}`)}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {hasEditPermission && (
            <Tooltip title="Delete">
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
        title="Employees"
        subtitle="Manage employee records, designations and costs"
        breadcrumbs={[
          { title: 'Dashboard', path: '/dashboard' },
          { title: 'Employees' },
        ]}
        action={
          hasEditPermission
            ? {
                label: 'Add Employee',
                icon: <AddIcon />,
                onClick: () => setOpenDialog(true),
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
              placeholder="Search by name or ID"
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
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              fullWidth
              variant="outlined"
              label="Filter by Designation"
              value={filterDesignation}
              onChange={(e) => setFilterDesignation(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FilterListIcon />
                  </InputAdornment>
                ),
              }}
              size="small"
            >
              <MenuItem value="all">All Designations</MenuItem>
              <MenuItem value="kam">KAM</MenuItem>
              <MenuItem value="os">OS</MenuItem>
              <MenuItem value="rs">RS</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={12} md={5} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
            {hasEditPermission && (
              <Button
                variant="outlined"
                startIcon={<UploadIcon />}
                onClick={() => setOpenImportDialog(true)}
                sx={{ ml: { xs: 0, md: 1 } }}
              >
                Import from Excel
              </Button>
            )}
          </Grid>
        </Grid>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <DataGrid
            rows={filteredEmployees}
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

      {/* Add/Edit Employee Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedEmployeeId ? 'Edit Employee' : 'Add New Employee'}
        </DialogTitle>
        <DialogContent>
          <EmployeeForm 
            employeeId={selectedEmployeeId} 
            onSave={async () => {
              setOpenDialog(false)
              setSelectedEmployeeId(null)
              const data = await getAllEmployees()
              setEmployees(data)
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog
        open={openImportDialog}
        onClose={() => !isUploading && setOpenImportDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Import Employees from Excel</DialogTitle>
        <DialogContent>
          <Box sx={{ py: 2 }}>
            <Typography variant="body1" gutterBottom>
              Upload an Excel file with employee data to bulk import records.
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              The file should have columns for: Employee ID, Name, Designation, Monthly Cost, Company DOJ, Notice Period Start, Notice Period End.
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
            Are you sure you want to delete employee "{employeeToDelete?.name}" ({employeeToDelete?.employeeId})?
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            This action cannot be undone and will remove all associated data.
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

export default Employees
