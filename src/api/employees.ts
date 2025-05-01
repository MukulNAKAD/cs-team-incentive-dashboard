import api from './config'
import { 
  Employee, 
  EmployeeDetail, 
  CreateEmployeeDto, 
  UpdateEmployeeDto 
} from '../types/api'

export const getAllEmployees = async (): Promise<Employee[]> => {
  try {
    const response = await api.get('/employees')
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch employees')
  }
}

export const getEmployeeById = async (id: string): Promise<EmployeeDetail> => {
  try {
    const response = await api.get(`/employees/${id}`)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch employee')
  }
}

export const getEmployeeByEmployeeId = async (employeeId: string): Promise<EmployeeDetail> => {
  try {
    const response = await api.get(`/employees/employee-id/${employeeId}`)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch employee')
  }
}

export const createEmployee = async (data: CreateEmployeeDto): Promise<Employee> => {
  try {
    const response = await api.post('/employees', data)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to create employee')
  }
}

export const updateEmployee = async (id: string, data: UpdateEmployeeDto): Promise<Employee> => {
  try {
    const response = await api.put(`/employees/${id}`, data)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to update employee')
  }
}

export const deleteEmployee = async (id: string): Promise<void> => {
  try {
    await api.delete(`/employees/${id}`)
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to delete employee')
  }
}

export const importEmployees = async (file: File): Promise<{ success: number; failed: number; errors: string[] }> => {
  try {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await api.post('/import/employees', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to import employees')
  }
}
