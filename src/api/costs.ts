import api from './config'
import { EmployeeCost, PodCost } from '../types/api'

export const getEmployeeCosts = async (year: number, month: number): Promise<EmployeeCost[]> => {
  try {
    const response = await api.get(`/costs/employees/${year}/${month}`)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch employee costs')
  }
}

export const getPodCosts = async (year: number, month: number): Promise<PodCost[]> => {
  try {
    const response = await api.get(`/costs/pods/${year}/${month}`)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch pod costs')
  }
}
