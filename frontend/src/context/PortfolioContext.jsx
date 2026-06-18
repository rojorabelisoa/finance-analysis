import React, { createContext, useContext, useReducer } from 'react'
import portfolioService from '../features/portfolio/services/portfolioService'

const PortfolioContext = createContext(null)

function portfolioReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false }
    case 'SET_POSITIONS':
      return { ...state, positions: action.payload, loading: false, error: null }
    case 'ADD_POSITION':
      return { ...state, positions: [...state.positions, action.payload], loading: false, error: null }
    case 'REMOVE_POSITION':
      return { ...state, positions: state.positions.filter((p) => p.id !== action.payload), loading: false }
    default:
      return state
  }
}

export function PortfolioProvider({ children }) {
  const [state, dispatch] = useReducer(portfolioReducer, {
    positions: [],
    loading: false,
    error: null,
  })

  async function fetchPositions() {
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const positions = await portfolioService.getPositions()
      dispatch({ type: 'SET_POSITIONS', payload: positions })
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message || 'Erreur lors du chargement' })
    }
  }

  async function addPosition(data) {
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const position = await portfolioService.addPosition(data)
      dispatch({ type: 'ADD_POSITION', payload: position })
      return position
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message || 'Erreur lors de l\'ajout' })
      throw err
    }
  }

  async function removePosition(id) {
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      await portfolioService.deletePosition(id)
      dispatch({ type: 'REMOVE_POSITION', payload: id })
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message || 'Erreur lors de la suppression' })
      throw err
    }
  }

  return (
    <PortfolioContext.Provider value={{ ...state, fetchPositions, addPosition, removePosition }}>
      {children}
    </PortfolioContext.Provider>
  )
}

export function usePortfolio() {
  const ctx = useContext(PortfolioContext)
  if (!ctx) throw new Error('usePortfolio must be used within PortfolioProvider')
  return ctx
}
