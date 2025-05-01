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
  MenuItem,
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
  Upload as UploadIcon,
  Business as BusinessIcon,
} from '@mui/icons-material'
import { useAuth } from '../../contexts/AuthContext'
import { getAllClients, deleteClient, importClients, getClientMappings } from '../../api'
import { Client } from '../../types/api'
import PageHeader from '../../components/PageHeader'
import ClientForm from './ClientForm'

const Clients = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [openImportDialog, setOpenImportDialog] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null)
  const [clientEmployees, setClientEmployees] = useState<{[key: string]: number}>({})

  // Check if user has admin rights
  const isAdmin = user?.role === 'admin'
  const hasEditPermission = isAdmin

  // Fetch clients data
  useEffect(() => {
    const fetchClients = async () => {
      try {
        setIsLoading(true)
        const data = await getAllClients()
        setClients(data)
        
        // Fetch employee mappings for each client
        const employeeCounts: {[key: string]: number} = {}
        for (const client of data) {
          try {
            const mappings = await getClientMappings(client.id)
            employeeCounts[client.id] = mappings.length
          } catch (error) {
            console.error(`Error fetching mappings for client ${client.id}:`, error)
            employeeCounts[client.id] = 0
          }
        }
        setClientEmployees(employeeCounts)
      } catch (error) {
        console.error('Error fetching clients:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchClients()
  }, [])

  // Handle client deletion
  const handleDeleteClick = (client: Client) => {
    setClientToDelete(client)
    setDeleteConfirmOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (clientToDelete) {
      try {
        await deleteClient(clientToDelete.id)
        setClients(clients.filter((c) => c.id !== clientToDelete.id))
        setDeleteConfirmOpen(false)
        setClientToDelete(null)
      } catch (error) {
        console.error('Error deleting client:', error)
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
      const result = await importClients(selectedFile)
      if (result.failed > 0) {
        setImportError(`Imported ${result.success} records with ${result.failed} failures.`)
      } else {
        setOpenImportDialog(false)
        // Refresh client list
        const data = await getAllClients()
        setClients(data)
      }
    } catch (error: any) {
      setImportError(error.message || 'Error importing file')
    } finally {
      setIsUploading(false)
    }
  }

  // Filter clients by search term
  const filteredClients = clients.filter((client) => {
    return (
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      client.crmId.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  // DataGrid columns
  const columns: GridColDef[] = [
    { 
      field: 'crmId', 
      headerName: 'CRM ID', 
      flex: 1,
      minWidth: 120 
    },
    { 
      field: 'name', 
      headerName: 'Client Name', 
      flex: 2,
      minWidth: 200 
    },
    { 
      field: 'employeeCount', 
      headerName: 'Assigned Employees', 
      flex: 1,
      minWidth: 150,
      valueGetter: (params) => clientEmployees[params.row.id] || 0
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 1,
      minWidth: 120,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams<Client>) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="View Details">
            <IconButton
              size="small"
              onClick={() => navigate(`/clients/${params.row.id}`)}
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
        title="Clients"
        subtitle="Manage client records and assignments"
        breadcrumbs={[
          { title: 'Dashboard', path: '/dashboard' },
          { title: 'Clients' },
        ]}
        action={
          hasEditPermission
            ? {
                label: 'Add Client',
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
              placeholder="Search by name or CRM ID"
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
          <Grid item xs={12} sm={6} md={8} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
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
            rows={filteredClients}
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

      {/* Add/Edit Client Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedClientId ? 'Edit Client' : 'Add New Client'}
        </DialogTitle>
        <DialogContent>
          <ClientForm 
            clientId={selectedClientId} 
            onSave={async () => {
              setOpenDialog(false)
              setSelectedClientId(null)
              const data = await getAllClients()
              setClients(data)
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
        <DialogTitle>Import Clients from Excel</DialogTitle>
        <DialogContent>
          <Box sx={{ py: 2 }}>
            <Typography variant="body1" gutterBottom>
              Upload an Excel file with client data to bulk import records.
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              The file should have columns for: CRM ID and Client Name.
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
            Are you sure you want to delete client "{clientToDelete?.name}" ({clientToDelete?.crmId})?
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

export default Clients
