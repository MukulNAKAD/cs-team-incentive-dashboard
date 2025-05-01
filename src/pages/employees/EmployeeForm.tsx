import { useState, useEffect } from 'react'
import {
  Box,
  Button,
  CircularProgress,
  Grid,
  TextField,
  MenuItem,
  FormHelperText,
  FormControl,
  InputLabel,
  Select,
  Alert,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { createEmployee, getEmployeeById, updateEmployee } from '../../api'
import { CreateEmployeeDto, UpdateEmployeeDto } from '../../types/api'

interface EmployeeFormProps {
  employeeId?: string | null
  onSave: () => void
}

interface FormErrors {
  employeeId?: string
  name?: string
  designation?: string
  monthlyCost?: string
  companyJoiningDate?: string
  noticePeriodStart?: string
  noticePeriodEnd?: string
}

const EmployeeForm = ({ employeeId, onSave }: EmployeeFormProps) => {
  const [formData, setFormData] = useState<CreateEmployeeDto>({
    employeeId: '',
    name: '',
    designation: 'rs',
    monthlyCost: 0,
    companyJoiningDate: new Date().toISOString().split('T')[0],
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [companyJoiningDate, setCompanyJoiningDate] = useState<Date | null>(new Date())
  const [noticePeriodStart, setNoticePeriodStart] = useState<Date | null>(null)
  const [noticePeriodEnd, setNoticePeriodEnd] = useState<Date | null>(null)

  // Load employee data if editing
  useEffect(() => {
    const fetchEmployee = async () => {
      if (!employeeId) return

      setIsLoading(true)
      try {
        const employee = await getEmployeeById(employeeId)
        setFormData({
          employeeId: employee.employeeId,
          name: employee.name,
          designation: employee.designation,
          monthlyCost: employee.monthlyCost,
          companyJoiningDate: employee.companyJoiningDate,
          noticePeriodStart: employee.noticePeriodStart || undefined,
          noticePeriodEnd: employee.noticePeriodEnd || undefined,
        })

        setCompanyJoiningDate(employee.companyJoiningDate ? new Date(employee.companyJoiningDate) : null)
        setNoticePeriodStart(employee.noticePeriodStart ? new Date(employee.noticePeriodStart) : null)
        setNoticePeriodEnd(employee.noticePeriodEnd ? new Date(employee.noticePeriodEnd) : null)
      } catch (error: any) {
        setError(error.message || 'Failed to load employee data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchEmployee()
  }, [employeeId])

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
    if (field === 'companyJoiningDate') {
      setCompanyJoiningDate(date)
      if (date) {
        setFormData((prev) => ({
          ...prev,
          companyJoiningDate: date.toISOString().split('T')[0],
        }))
      }
    } else if (field === 'noticePeriodStart') {
      setNoticePeriodStart(date)
      if (date) {
        setFormData((prev) => ({
          ...prev,
          noticePeriodStart: date.toISOString().split('T')[0],
        }))
      } else {
        setFormData((prev) => {
          const newData = { ...prev }
          delete newData.noticePeriodStart
          return newData
        })
      }
    } else if (field === 'noticePeriodEnd') {
      setNoticePeriodEnd(date)
      if (date) {
        setFormData((prev) => ({
          ...prev,
          noticePeriodEnd: date.toISOString().split('T')[0],
        }))
      } else {
        setFormData((prev) => {
          const newData = { ...prev }
          delete newData.noticePeriodEnd
          return newData
        })
      }
    }
  }

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.employeeId.trim()) {
      newErrors.employeeId = 'Employee ID is required'
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!formData.designation) {
      newErrors.designation = 'Designation is required'
    }

    if (!formData.monthlyCost || formData.monthlyCost <= 0) {
      newErrors.monthlyCost = 'Monthly cost must be greater than 0'
    }

    if (!formData.companyJoiningDate) {
      newErrors.companyJoiningDate = 'Company joining date is required'
    }

    // If notice period start is set, end date should also be set
    if (formData.noticePeriodStart && !formData.noticePeriodEnd) {
      newErrors.noticePeriodEnd = 'Notice period end date is required when start date is set'
    }

    // Notice period end date should be after start date
    if (
      formData.noticePeriodStart &&
      formData.noticePeriodEnd &&
      new Date(formData.noticePeriodStart) >= new Date(formData.noticePeriodEnd)
    ) {
      newErrors.noticePeriodEnd = 'Notice period end date should be after start date'
    }

    setErrors(newErrors)
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
      if (employeeId) {
        // Update existing employee
        const updateData: UpdateEmployeeDto = {
          name: formData.name,
          designation: formData.designation,
          monthlyCost: formData.monthlyCost,
          companyJoiningDate: formData.companyJoiningDate,
          noticePeriodStart: formData.noticePeriodStart || null,
          noticePeriodEnd: formData.noticePeriodEnd || null,
        }
        
        await updateEmployee(employeeId, updateData)
      } else {
        // Create new employee
        await createEmployee(formData)
      }
      
      onSave()
    } catch (error: any) {
      setError(error.message || 'Failed to save employee')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <TextField
            name="employeeId"
            label="Employee ID"
            value={formData.employeeId}
            onChange={handleChange}
            fullWidth
            required
            error={!!errors.employeeId}
            helperText={errors.employeeId}
            disabled={!!employeeId} // Disable when editing
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            name="name"
            label="Name"
            value={formData.name}
            onChange={handleChange}
            fullWidth
            required
            error={!!errors.name}
            helperText={errors.name}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth error={!!errors.designation}>
            <InputLabel id="designation-label">Designation</InputLabel>
            <Select
              labelId="designation-label"
              name="designation"
              value={formData.designation}
              onChange={handleChange}
              label="Designation"
            >
              <MenuItem value="kam">Key Account Manager (KAM)</MenuItem>
              <MenuItem value="os">Overall Success Manager (OS)</MenuItem>
              <MenuItem value="rs">Relationship Success Manager (RS)</MenuItem>
            </Select>
            {errors.designation && <FormHelperText>{errors.designation}</FormHelperText>}
          </FormControl>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            name="monthlyCost"
            label="Monthly Cost"
            type="number"
            value={formData.monthlyCost}
            onChange={handleChange}
            fullWidth
            required
            inputProps={{ min: 0, step: 1000 }}
            error={!!errors.monthlyCost}
            helperText={errors.monthlyCost}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Company Joining Date"
              value={companyJoiningDate}
              onChange={(date) => handleDateChange(date, 'companyJoiningDate')}
              slotProps={{
                textField: {
                  fullWidth: true,
                  required: true,
                  error: !!errors.companyJoiningDate,
                  helperText: errors.companyJoiningDate,
                },
              }}
            />
          </LocalizationProvider>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Notice Period Start (Optional)"
              value={noticePeriodStart}
              onChange={(date) => handleDateChange(date, 'noticePeriodStart')}
              slotProps={{
                textField: {
                  fullWidth: true,
                  error: !!errors.noticePeriodStart,
                  helperText: errors.noticePeriodStart,
                },
              }}
            />
          </LocalizationProvider>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Notice Period End (Optional)"
              value={noticePeriodEnd}
              onChange={(date) => handleDateChange(date, 'noticePeriodEnd')}
              disabled={!noticePeriodStart}
              slotProps={{
                textField: {
                  fullWidth: true,
                  error: !!errors.noticePeriodEnd,
                  helperText: errors.noticePeriodEnd,
                },
              }}
            />
          </LocalizationProvider>
        </Grid>
      </Grid>
      
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          type="submit"
          variant="contained"
          disabled={isSaving}
          startIcon={isSaving ? <CircularProgress size={20} /> : undefined}
        >
          {isSaving ? 'Saving...' : employeeId ? 'Update Employee' : 'Create Employee'}
        </Button>
      </Box>
    </Box>
  )
}

export default EmployeeForm
