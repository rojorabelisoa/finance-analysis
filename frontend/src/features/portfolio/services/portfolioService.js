import api from '../../../shared/hooks/useApi'

const portfolioService = {
  async getPositions() {
    const response = await api.get('/positions')
    return response.data
  },

  async addPosition(data) {
    const response = await api.post('/positions', data)
    return response.data
  },

  async deletePosition(id) {
    const response = await api.delete(`/positions/${id}`)
    return response.data
  },
}

export default portfolioService
