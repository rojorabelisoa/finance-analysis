import api from '../../../shared/hooks/useApi'

const alertService = {
  async getAlerts() {
    const response = await api.get('/alerts')
    return response.data
  },
  async createAlert(data) {
    const response = await api.post('/alerts', data)
    return response.data
  },
  async deleteAlert(id) {
    await api.delete(`/alerts/${id}`)
  },
}

export default alertService
