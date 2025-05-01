import api from './config'
import { 
  Target, 
  CreateTargetDto, 
  UpdateTargetDto, 
  BulkCreateTargetDto 
} from '../types/api'

export const getAllTargets = async (): Promise<Target[]> => {
  try {
    const response = await api.get('/targets')
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch targets')
  }
}

export const getTargetById = async (id: string): Promise<Target> => {
  try {
    const response = await api.get(`/targets/${id}`)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch target')
  }
}

export const getTargetsByYearAndMonth = async (year: number, month: number): Promise<Target[]> => {
  try {
    const response = await api.get(`/targets/period/${year}/${month}`)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch targets for period')
  }
}

export const getTargetByEmployeeAndPeriod = async (
  employeeId: string, 
  year: number, 
  month: number, 
  type: 'revenue' | 'gm'
): Promise<Target> => {
  try {
    const response = await api.get(`/targets/employee/${employeeId}/${year}/${month}/${type}`)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch target for employee')
  }
}

export const getEmployeeTargets = async (employeeId: string): Promise<Target[]> => {
  try {
    const response = await api.get(`/targets/employee/${employeeId}`)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch employee targets')
  }
}

export const createTarget = async (data: CreateTargetDto): Promise<Target> => {
  try {
    const response = await api.post('/targets', data)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to create target')
  }
}

export const updateTarget = async (id: string, data: UpdateTargetDto): Promise<Target> => {
  try {
    const response = await api.put(`/targets/${id}`, data)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to update target')
  }
}

export const deleteTarget = async (id: string): Promise<void> => {
  try {
    await api.delete(`/targets/${id}`)
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to delete target')
  }
}

export const bulkCreateTargets = async (data: BulkCreateTargetDto): Promise<Target[]> => {
  try {
    const response = await api.post('/targets/bulk', data)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to bulk create targets')
  }
}

export const importTargets = async (file: File): Promise<{ success: number; failed: number; errors: string[] }> => {
  try {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await api.post('/import/targets', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to import targets')
  }
}
