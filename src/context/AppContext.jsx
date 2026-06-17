import React, { createContext, useContext, useState, useCallback } from 'react'
import {
  seatService,
  paintService,
  paintPackageService,
  bookingService,
  workService,
} from '../services/business.js'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [seats, setSeats] = useState(() => seatService.getAllSeats())
  const [paints, setPaints] = useState(() => paintService.getAllPaints())
  const [paintPackages, setPaintPackages] = useState(() => paintPackageService.getAllPackages())
  const [bookings, setBookings] = useState(() => bookingService.getAllBookings())
  const [works, setWorks] = useState(() => workService.getAllWorks())
  const [currentRole, setCurrentRole] = useState('student')
  const [currentStudent, setCurrentStudent] = useState({
    id: 'STU001',
    name: '张小明',
  })
  const [notification, setNotification] = useState(null)

  const refreshSeats = useCallback(() => {
    setSeats(seatService.getAllSeats())
  }, [])

  const refreshPaints = useCallback(() => {
    setPaints(paintService.getAllPaints())
  }, [])

  const refreshPaintPackages = useCallback(() => {
    setPaintPackages(paintPackageService.getAllPackages())
  }, [])

  const refreshBookings = useCallback(() => {
    setBookings(bookingService.getAllBookings())
  }, [])

  const refreshWorks = useCallback(() => {
    setWorks(workService.getAllWorks())
  }, [])

  const refreshAll = useCallback(() => {
    refreshSeats()
    refreshPaints()
    refreshPaintPackages()
    refreshBookings()
    refreshWorks()
  }, [refreshSeats, refreshPaints, refreshPaintPackages, refreshBookings, refreshWorks])

  const showNotification = useCallback((message, type = 'info') => {
    setNotification({ message, type, id: Date.now() })
    setTimeout(() => setNotification(null), 3000)
  }, [])

  const value = {
    seats,
    paints,
    paintPackages,
    bookings,
    works,
    currentRole,
    setCurrentRole,
    currentStudent,
    setCurrentStudent,
    notification,
    showNotification,
    refreshSeats,
    refreshPaints,
    refreshPaintPackages,
    refreshBookings,
    refreshWorks,
    refreshAll,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) {
    throw new Error('useApp must be used within AppProvider')
  }
  return ctx
}
