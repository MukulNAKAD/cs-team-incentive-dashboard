import api from './config'
import { 
  Incentive, 
  GetIncentiveDto, 
  IncentiveCalculation, 
  SaveIncentivesRequest, 
  FreezeIncentiveDto 
} from '../types/api'

export const getAllIncentives = async (): Promise<Incentive[]> => {
  try {
    const response = await api.get('/incentives')
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch incentives')
  }
}

export const getIncentiveById = async (id: string): Promise<Incentive> => {
  try {
    const response = await api.get(`/incentives/${id}`)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch incentive')
  }
}

export const getIncentivesByYearAndMonth = async (year: number, month: number): Promise<Incentive[]> => {
  try {
    const response = await api.get(`/incentives/period/${year}/${month}`)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch incentives for period')
  }
}

export const getIncentiveByEmployeeAndPeriod = async (data: GetIncentiveDto): Promise<Incentive> => {
  try {
    const response = await api.post('/incentives/employee/period', data)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch incentive for employee')
  }
}

export const getEmployeeIncentives = async (employeeId: string): Promise<Incentive[]> => {
  try {
    const response = await api.get(`/incentives/employee/${employeeId}`)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch employee incentives')
  }
}

export const calculateIncentives = async (year: number, month: number): Promise<IncentiveCalculation[]> => {
  try {
    const response = await api.get(`/incentives/calculate/${year}/${month}`)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to calculate incentives')
  }
}

export const saveIncentives = async (data: SaveIncentivesRequest[]): Promise<Incentive[]> => {
  try {
    const response = await api.post('/incentives/save', data)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to save incentives')
  }
}

export const freezeIncentives = async (data: FreezeIncentiveDto): Promise<Incentive[]> => {
  try {
    const response = await api.post('/incentives/freeze', data)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to freeze incentives')
  }
}
