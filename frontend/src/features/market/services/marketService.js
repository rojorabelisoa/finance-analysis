import api from '../../../shared/hooks/useApi'

const marketService = {
  async getQuote(ticker) {
    const response = await api.get(`/market/quote/${ticker}`)
    return response.data
  },

  async getFundamentals(ticker) {
    const response = await api.get(`/market/fundamentals/${ticker}`)
    return response.data
  },

  async searchTicker(query) {
    const response = await api.get('/market/search', { params: { q: query } })
    return response.data
  },

  async getTechnical(ticker, limit = 200) {
    const response = await api.get(`/market/technical/${ticker}`, { params: { limit } })
    return response.data
  },
}

export default marketService
