import { useState, useEffect } from 'react'
import {
  Box,
  Button,
  CircularProgress,
  Grid,
  TextField,
  Alert,
} from '@mui/material'
import { createClient, getClientById, updateClient } from '../../api'
import { CreateClientDto, UpdateClientDto } from '../../types/api'

interface ClientFormProps {
  clientId?: string | null
  onSave: () => void
}

interface FormErrors {
  crmId?: string
  name?: string
}

const ClientForm = ({ clientId, onSave }: ClientFormProps) => {
  const [formData, setFormData] = useState<CreateClientDto>({
    crmId: '',
    name: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load client data if editing
  useEffect(() => {
    const fetchClient = async () => {
      if (!clientId) return

      setIsLoading(true)
      try {
        const client = await getClientById(clientId)
        setFormData({
          crmId: client.crmId,
          name: client.name,
        })
      } catch (error: any) {
        setError(error.message || 'Failed to load client data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchClient()
  }, [clientId])

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.crmId.trim()) {
      newErrors.crmId = 'CRM ID is required'
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Client name is required'
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
      if (clientId) {
        // Update existing client
        const updateData: UpdateClientDto = {
          name: formData.name,
        }
        
        await updateClient(clientId, updateData)
      } else {
        // Create new client
        await createClient(formData)
      }
      
      onSave()
    } catch (error: any) {
      setError(error.message || 'Failed to save client')
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
            name="crmId"
            label="CRM ID"
            value={formData.crmId}
            onChange={handleChange}
            fullWidth
            required
            error={!!errors.crmId}
            helperText={errors.crmId}
            disabled={!!clientId} // Disable when editing
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            name="name"
            label="Client Name"
            value={formData.name}
            onChange={handleChange}
            fullWidth
            required
            error={!!errors.name}
            helperText={errors.name}
          />
        </Grid>
      </Grid>
      
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          type="submit"
          variant="contained"
          disabled={isSaving}
          startIcon={isSaving ? <CircularProgress size={20} /> : undefined}
        >
          {isSaving ? 'Saving...' : clientId ? 'Update Client' : 'Create Client'}
        </Button>
      </Box>
    </Box>
  )
}

export default ClientForm
