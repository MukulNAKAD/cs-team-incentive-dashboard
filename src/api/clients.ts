import api from './config'
import { 
  Client, 
  ClientDetail, 
  CreateClientDto, 
  UpdateClientDto,
  ClientMapping,
  CreateClientMappingDto,
  UpdateClientMappingDto
} from '../types/api'

export const getAllClients = async (): Promise<Client[]> => {
  try {
    const response = await api.get('/clients')
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch clients')
  }
}

export const getClientById = async (id: string): Promise<ClientDetail> => {
  try {
    const response = await api.get(`/clients/${id}`)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch client')
  }
}

export const getClientByCrmId = async (crmId: string): Promise<ClientDetail> => {
  try {
    const response = await api.get(`/clients/crm-id/${crmId}`)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch client')
  }
}

export const createClient = async (data: CreateClientDto): Promise<Client> => {
  try {
    const response = await api.post('/clients', data)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to create client')
  }
}

export const updateClient = async (id: string, data: UpdateClientDto): Promise<Client> => {
  try {
    const response = await api.put(`/clients/${id}`, data)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to update client')
  }
}

export const deleteClient = async (id: string): Promise<void> => {
  try {
    await api.delete(`/clients/${id}`)
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to delete client')
  }
}

export const createClientMapping = async (data: CreateClientMappingDto): Promise<ClientMapping> => {
  try {
    const response = await api.post('/clients/mappings', data)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to create client mapping')
  }
}

export const updateClientMapping = async (id: string, data: UpdateClientMappingDto): Promise<ClientMapping> => {
  try {
    const response = await api.put(`/clients/mappings/${id}`, data)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to update client mapping')
  }
}

export const getClientMappings = async (clientId: string): Promise<ClientMapping[]> => {
  try {
    const response = await api.get(`/clients/mappings/client/${clientId}`)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch client mappings')
  }
}

export const getEmployeeClients = async (employeeId: string): Promise<ClientMapping[]> => {
  try {
    const response = await api.get(`/clients/mappings/employee/${employeeId}`)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch employee clients')
  }
}

export const importClients = async (file: File): Promise<{ success: number; failed: number; errors: string[] }> => {
  try {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await api.post('/import/clients', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to import clients')
  }
}

export const importClientMappings = async (file: File): Promise<{ success: number; failed: number; errors: string[] }> => {
  try {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await api.post('/import/client-mappings', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to import client mappings')
  }
}
