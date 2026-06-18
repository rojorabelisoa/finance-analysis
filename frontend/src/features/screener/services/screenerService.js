import api from '../../../shared/hooks/useApi'

const screenerService = {
  async screen(filters = {}, page = 0, size = 20) {
    const params = { page, size }
    if (filters.peMax !== '' && filters.peMax != null) params.peMax = filters.peMax
    if (filters.revenueGrowthMin !== '' && filters.revenueGrowthMin != null) params.revenueGrowthMin = filters.revenueGrowthMin / 100
    if (filters.epsGrowthMin !== '' && filters.epsGrowthMin != null) params.epsGrowthMin = filters.epsGrowthMin / 100
    const response = await api.get('/screener', { params })
    return response.data
  },
}

export default screenerService
