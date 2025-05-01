import api from './config'
import { GenerateReportDto } from '../types/api'

export const generateReport = async (data: GenerateReportDto): Promise<Blob> => {
  try {
    const response = await api.post('/reports/generate', data, {
      responseType: 'blob',
    })
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to generate report')
  }
}

export const downloadReport = (blob: Blob, filename: string): void => {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}
