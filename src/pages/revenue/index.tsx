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
} from '@mui/material'
import { 
  DataGrid, 
  GridColDef, 
  GridRenderCellParams,
  GridValueFormatterParams,
  GridToolbar,
} from '@mui/x-data-grid'
import { 
  Add as AddIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Upload as UploadIcon,
  AttachMoney as MoneyIcon,
  CalendarMonth as CalendarIcon,
} from '@mui/icons-material'
import { format } from 'date-fns'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'

import { useAuth } from '../../contexts/AuthContext'
import { getAllRevenues, deleteRevenue, importRevenues, getMonthlyRevenues, getAllClients } from '../../api'
import { Revenue, CreateRevenueDto, Client } from '../../types/api'
import PageHeader from '../../components/PageHeader'

interface RevenueFormData {
  clientId: string
  invoiceId: string
  invoiceDate: string
  serviceStartDate: string
  serviceEndDate: string
  preTaxTotal: number
  totalAmount: number
}

interface RevenueFormErrors {
  clientId?: string
  invoiceId?: string
  invoiceDate?: string
  serviceStartDate?: string
  serviceEndDate?: string
  preTaxTotal?: string
  totalAmount?: string
}

const RevenuePage = () => {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const hasEditPermission = isAdmin
  
  const [revenues, setRevenues] = useState<Revenue[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [openImportDialog, setOpenImportDialog] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [revenueToDelete, setRevenueToDelete] = useState<Revenue | null>(null)
  const [formData, setFormData] = useState<RevenueFormData>({
    clientId: '',
    invoiceId: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    serviceStartDate: new Date().toISOString().split('T')[0],
    serviceEndDate: new Date().toISOString().split('T')[0],
    preTaxTotal: 0,
    totalAmount: 0,
  })
  const [formErrors, setFormErrors] = useState<RevenueFormErrors>({})
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [invoiceDate, setInvoiceDate] = useState<Date | null>(new Date())
  const [serviceStartDate, setServiceStartDate] = useState<Date | null>(new Date())
  const [serviceEndDate, setServiceEndDate] = useState<Date | null>(new Date())
  const [year, setYear] = useState<number>(new Date().getFullYear())
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1)
  const [viewMode, setViewMode] = useState<'all' | 'monthly'>('all')
  const [monthlyRevenues, setMonthlyRevenues] = useState<any[]>([])
  const [isMonthlyLoading, setIsMonthlyLoading] = useState(false)

  // Fetch revenue data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        
        if (hasEditPermission) {
          const [revenuesData, clientsData] = await Promise.all([
            getAllRevenues(),
            getAllClients()
          ])
          
          setRevenues(revenuesData)
          setClients(clientsData)
        }
      } catch (error) {
        console.error('Error fetching revenue data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [hasEditPermission])

  // Fetch monthly revenue data when year/month changes
  useEffect(() => {
    const fetchMonthlyData = async () => {
      if (viewMode !== 'monthly') return
      
      try {
        setIsMonthlyLoading(true)
        const data = await getMonthlyRevenues(year, month)
        setMonthlyRevenues(data)
      } catch (error) {
        console.error('Error fetching monthly revenues:', error)
      } finally {
        setIsMonthlyLoading(false)
      }
    }

    fetchMonthlyData()
  }, [year, month, viewMode])

  // Handle revenue deletion
  const handleDeleteClick = (revenue: Revenue) => {
    setRevenueToDelete(revenue)
    setDeleteConfirmOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (revenueToDelete) {
      try {
        await deleteRevenue(revenueToDelete.id)
        setRevenues(revenues.filter((r) => r.id !== revenueToDelete.id))
        setDeleteConfirmOpen(false)
        setRevenueToDelete(null)
      } catch (error) {
        console.error('Error deleting revenue:', error)
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
      const result = await importRevenues(selectedFile)
      if (result.failed > 0) {
        setImportError(`Imported ${result.success} records with ${result.failed} failures.`)
      } else {
        setOpenImportDialog(false)
        // Refresh revenue list
        const data = await getAllRevenues()
        setRevenues(data)
      }
    } catch (error: any) {
      setImportError(error.message || 'Error importing file')
    } finally {
      setIsUploading(false)
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

  // Handle date changes
  const handleDateChange = (date: Date | null, field: string) => {
    if (field === 'invoiceDate') {
      setInvoiceDate(date)
      if (date) {
        setFormData((prev) => ({
          ...prev,
          invoiceDate: date.toISOString().split('T')[0],
        }))
      }
    } else if (field === 'serviceStartDate') {
      setServiceStartDate(date)
      if (date) {
        setFormData((prev) => ({
          ...prev,
          serviceStartDate: date.toISOString().split('T')[0],
        }))
      }
    } else if (field === 'serviceEndDate') {
      setServiceEndDate(date)
      if (date) {
        setFormData((prev) => ({
          ...prev,
          serviceEndDate: date.toISOString().split('T')[0],
        }))
      }
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

  // Filter revenues by search term
  const filteredRevenues = revenues.filter((revenue) => {
    return (
      revenue.invoiceId.toLowerCase().includes(searchTerm.toLowerCase()) || 
      revenue.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      revenue.client.crmId.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  // DataGrid columns for all revenues
  const allRevenuesColumns: GridColDef[] = [
    { 
      field: 'invoiceId', 
      headerName: 'Invoice ID', 
      flex: 1,
      minWidth: 120 
    },
    { 
      field: 'clientName', 
      headerName: 'Client', 
      flex: 1.5,
      minWidth: 180,
      valueGetter: (params) => params.row.client.name
    },
    {
      field: 'invoiceDate',
      headerName: 'Invoice Date',
      flex: 1,
      minWidth: 120,
      valueFormatter: (params: GridValueFormatterParams<string>) => {
        return format(new Date(params.value), 'dd/MM/yyyy')
      }
    },
    {
      field: 'serviceStartDate',
      headerName: 'Service Start',
      flex: 1,
      minWidth: 120,
      valueFormatter: (params: GridValueFormatterParams<string>) => {
        return format(new Date(params.value), 'dd/MM/yyyy')
      }
    },
    {
      field: 'serviceEndDate',
      headerName: 'Service End',
      flex: 1,
      minWidth: 120,
      valueFormatter: (params: GridValueFormatterParams<string>) => {
        return format(new Date(params.value), 'dd/MM/yyyy')
      }
    },
    {
      field: 'totalAmount',
      headerName: 'Amount',
      flex: 1,
      minWidth: 120,
      align: 'right',
      valueFormatter: (params: GridValueFormatterParams<number>) => {
        return `₹${params.value.toLocaleString()}`
      }
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 0.7,
      minWidth: 80,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams<Revenue>) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
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

  // DataGrid columns for monthly revenues
  const monthlyRevenuesColumns: GridColDef[] = [
    { 
      field: 'client', 
      headerName: 'Client', 
      flex: 1.5,
      minWidth: 180,
      valueGetter: (params) => params.row.revenue.client.name
    },
    { 
      field: 'crmId', 
      headerName: 'CRM ID', 
      flex: 1,
      minWidth: 120,
      valueGetter: (params) => params.row.revenue.client.crmId
    },
    {
      field: 'invoiceId',
      headerName: 'Invoice ID',
      flex: 1,
      minWidth: 120,
      valueGetter: (params) => params.row.revenue.invoiceId
    },
    {
      field: 'serviceDays',
      headerName: 'Service Days',
      flex: 0.8,
      minWidth: 100,
      align: 'center'
    },
    {
      field: 'amount',
      headerName: 'Monthly Amount',
      flex: 1,
      minWidth: 150,
      align: 'right',
      valueFormatter: (params: GridValueFormatterParams<number>) => {
        return `₹${params.value.toLocaleString()}`
      }
    }
  ]

  if (!hasEditPermission) {
    return (
      <Box>
        <PageHeader
          title="Revenue"
          subtitle="View and manage revenue data"
          breadcrumbs={[
            { title: 'Dashboard', path: '/dashboard' },
            { title: 'Revenue' },
          ]}
        />
        
        <Alert severity="warning" sx={{ mb: 3 }}>
          You don't have permission to access this page. Only admins can view revenue data.
        </Alert>
      </Box>
    )
  }

  return (
    <Box>
      <PageHeader
        title="Revenue"
        subtitle="View and manage revenue data"
        breadcrumbs={[
          { title: 'Dashboard', path: '/dashboard' },
          { title: 'Revenue' },
        ]}
        action={
          hasEditPermission
            ? {
                label: 'Import Revenue',
                icon: <UploadIcon />,
                onClick: () => setOpenImportDialog(true),
              }
            : undefined
        }
      />

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search by invoice or client"
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
          
          <Grid item xs={12} sm={6} md={6}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="view-mode-label">View Mode</InputLabel>
                <Select
                  labelId="view-mode-label"
                  value={viewMode}
                  onChange={(e) => setViewMode(e.target.value as 'all' | 'monthly')}
                  label="View Mode"
                >
                  <MenuItem value="all">All Invoices</MenuItem>
                  <MenuItem value="monthly">Monthly Breakdown</MenuItem>
                </Select>
              </FormControl>
              
              {viewMode === 'monthly' && (
                <>
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
                </>
              )}
            </Box>
          </Grid>
        </Grid>

        {viewMode === 'all' ? (
          isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <DataGrid
              rows={filteredRevenues}
              columns={allRevenuesColumns}
              initialState={{
                pagination: {
                  paginationModel: { page: 0, pageSize: 10 },
                },
                sorting: {
                  sortModel: [{ field: 'invoiceDate', sort: 'desc' }],
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
          isMonthlyLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">
                  Monthly Revenue: {getMonths().find(m => m.value === month)?.label} {year}
                </Typography>
                <Typography variant="h6" color="primary">
                  Total: ₹{monthlyRevenues.reduce((sum, item) => sum + item.amount, 0).toLocaleString()}
                </Typography>
              </Box>
              
              <DataGrid
                rows={monthlyRevenues}
                columns={monthlyRevenuesColumns}
                initialState={{
                  pagination: {
                    paginationModel: { page: 0, pageSize: 10 },
                  },
                  sorting: {
                    sortModel: [{ field: 'amount', sort: 'desc' }],
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
            </>
          )
        )}
      </Paper>

      {/* Import Dialog */}
      <Dialog
        open={openImportDialog}
        onClose={() => !isUploading && setOpenImportDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Import Revenue Data</DialogTitle>
        <DialogContent>
          <Box sx={{ py: 2 }}>
            <Typography variant="body1" gutterBottom>
              Upload an Excel file with revenue data to bulk import records.
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              The file should include: CRM ID, Invoice ID, Invoice Date, Service Start Date, Service End Date, Pre-Tax Total, and Total Amount.
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
            Are you sure you want to delete invoice "{revenueToDelete?.invoiceId}"?
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            This action cannot be undone and will affect all related incentive calculations.
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

export default RevenuePage
