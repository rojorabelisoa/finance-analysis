import api from '../../../shared/hooks/useApi'

const authService = {
  async login(username, password) {
    const response = await api.post('/auth/login', { username, password })
    return response.data
  },

  async register(username, email, password) {
    const response = await api.post('/auth/register', { username, email, password })
    return response.data
  },
}

export default authService
