import api from './config'
import { LoginDto, LoginResponse, RegisterUserDto } from '../types/api'

export const loginUser = async (data: LoginDto): Promise<LoginResponse> => {
  try {
    const response = await api.post('/auth/login', data)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'An error occurred during login')
  }
}

export const registerUser = async (data: RegisterUserDto): Promise<LoginResponse> => {
  try {
    const response = await api.post('/auth/register', data)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'An error occurred during registration')
  }
}
