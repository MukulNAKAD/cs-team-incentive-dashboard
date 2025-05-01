import api from './config'
import { 
  Revenue, 
  RevenueDetail, 
  CreateRevenueDto, 
  ImportRevenueDto,
  MonthlyRevenue
} from '../types/api'

export const getAllRevenues = async (): Promise<Revenue[]> => {
  try {
    const response = await api.get('/revenue')
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch revenues')
  }
}

export const getRevenueById = async (id: string): Promise<RevenueDetail> => {
  try {
    const response = await api.get(`/revenue/${id}`)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch revenue')
  }
}

export const getRevenueByInvoiceId = async (invoiceId: string): Promise<RevenueDetail> => {
  try {
    const response = await api.get(`/revenue/invoice/${invoiceId}`)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch revenue')
  }
}

export const createRevenue = async (data: CreateRevenueDto): Promise<RevenueDetail> => {
  try {
    const response = await api.post('/revenue', data)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to create revenue')
  }
}

export const deleteRevenue = async (id: string): Promise<void> => {
  try {
    await api.delete(`/revenue/${id}`)
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to delete revenue')
  }
}

export const bulkImportRevenue = async (data: ImportRevenueDto): Promise<RevenueDetail[]> => {
  try {
    const response = await api.post('/revenue/import', data)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to bulk import revenue')
  }
}

export const getMonthlyRevenues = async (year: number, month: number): Promise<MonthlyRevenue[]> => {
  try {
    const response = await api.get(`/revenue/monthly/${year}/${month}`)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch monthly revenues')
  }
}

export const importRevenues = async (file: File): Promise<{ success: number; failed: number; errors: string[] }> => {
  try {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await api.post('/import/revenue', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to import revenues')
  }
}
