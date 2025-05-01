import api from './config'
import { 
  Pod, 
  PodDetail, 
  CreatePodDto, 
  UpdatePodDto,
  PodMember,
  CreatePodMemberDto,
  UpdatePodMemberDto
} from '../types/api'

export const getAllPods = async (): Promise<Pod[]> => {
  try {
    const response = await api.get('/pods')
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch pods')
  }
}

export const getPodById = async (id: string): Promise<PodDetail> => {
  try {
    const response = await api.get(`/pods/${id}`)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch pod')
  }
}

export const getPodsByKamId = async (kamId: string): Promise<PodDetail[]> => {
  try {
    const response = await api.get(`/pods/kam/${kamId}`)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch pods for KAM')
  }
}

export const createPod = async (data: CreatePodDto): Promise<Pod> => {
  try {
    const response = await api.post('/pods', data)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to create pod')
  }
}

export const updatePod = async (id: string, data: UpdatePodDto): Promise<Pod> => {
  try {
    const response = await api.put(`/pods/${id}`, data)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to update pod')
  }
}

export const deletePod = async (id: string): Promise<void> => {
  try {
    await api.delete(`/pods/${id}`)
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to delete pod')
  }
}

export const addPodMember = async (data: CreatePodMemberDto): Promise<PodMember> => {
  try {
    const response = await api.post('/pods/members', data)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to add pod member')
  }
}

export const updatePodMember = async (id: string, data: UpdatePodMemberDto): Promise<PodMember> => {
  try {
    const response = await api.put(`/pods/members/${id}`, data)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to update pod member')
  }
}

export const removePodMember = async (id: string): Promise<void> => {
  try {
    await api.delete(`/pods/members/${id}`)
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to remove pod member')
  }
}

export const getPodMembers = async (podId: string): Promise<PodMember[]> => {
  try {
    const response = await api.get(`/pods/members/pod/${podId}`)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch pod members')
  }
}

export const getEmployeePods = async (employeeId: string): Promise<PodMember[]> => {
  try {
    const response = await api.get(`/pods/members/employee/${employeeId}`)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch employee pods')
  }
}
