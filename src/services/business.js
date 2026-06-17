import { storage, CLEAN_STATUS, BOOKING_STATUS, TIME_SLOTS } from '../data/storage.js'

function generateId(prefix) {
  return prefix + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase()
}

export const seatService = {
  getAllSeats() {
    return storage.getSeats()
  },

  getAvailableSeats() {
    const seats = storage.getSeats()
    return seats.filter(s => s.isActive && s.cleanStatus === CLEAN_STATUS.CLEANED)
  },

  addSeat(seatData) {
    const seats = storage.getSeats()
    const newSeat = {
      id: generateId('S'),
      name: seatData.name,
      location: seatData.location || '',
      cleanStatus: CLEAN_STATUS.CLEANED,
      isActive: true,
    }
    seats.push(newSeat)
    storage.saveSeats(seats)
    return newSeat
  },

  updateSeat(seatId, updates) {
    const seats = storage.getSeats()
    const index = seats.findIndex(s => s.id === seatId)
    if (index === -1) throw new Error('座位不存在')
    seats[index] = { ...seats[index], ...updates }
    storage.saveSeats(seats)
    return seats[index]
  },

  deleteSeat(seatId) {
    const seats = storage.getSeats()
    const bookings = storage.getBookings()
    const hasActiveBooking = bookings.some(
      b => b.seatId === seatId && b.status === BOOKING_STATUS.BOOKED
    )
    if (hasActiveBooking) {
      throw new Error('该座位存在未完成的预约，无法删除')
    }
    const newSeats = seats.filter(s => s.id !== seatId)
    storage.saveSeats(newSeats)
  },

  setCleanStatus(seatId, status) {
    return this.updateSeat(seatId, { cleanStatus: status })
  },

  toggleActive(seatId) {
    const seats = storage.getSeats()
    const seat = seats.find(s => s.id === seatId)
    if (!seat) throw new Error('座位不存在')
    return this.updateSeat(seatId, { isActive: !seat.isActive })
  },
}

export const paintService = {
  getAllPaints() {
    return storage.getPaints()
  },

  getLowStockPaints() {
    const paints = storage.getPaints()
    return paints.filter(p => p.stock <= p.threshold)
  },

  getPaintById(paintId) {
    const paints = storage.getPaints()
    return paints.find(p => p.id === paintId)
  },

  addPaint(paintData) {
    const paints = storage.getPaints()
    const newPaint = {
      id: generateId('P'),
      name: paintData.name,
      color: paintData.color || '#CCCCCC',
      stock: Number(paintData.stock) || 0,
      unit: paintData.unit || '管',
      threshold: Number(paintData.threshold) || 10,
      price: Number(paintData.price) || 0,
    }
    paints.push(newPaint)
    storage.savePaints(paints)
    return newPaint
  },

  updatePaint(paintId, updates) {
    const paints = storage.getPaints()
    const index = paints.findIndex(p => p.id === paintId)
    if (index === -1) throw new Error('颜料不存在')
    paints[index] = { ...paints[index], ...updates }
    storage.savePaints(paints)
    return paints[index]
  },

  deletePaint(paintId) {
    const paints = storage.getPaints()
    const newPaints = paints.filter(p => p.id !== paintId)
    storage.savePaints(newPaints)
  },

  updateStock(paintId, amount) {
    const paints = storage.getPaints()
    const index = paints.findIndex(p => p.id === paintId)
    if (index === -1) throw new Error('颜料不存在')
    const newStock = paints[index].stock + amount
    if (newStock < 0) throw new Error(`颜料库存不足，当前库存：${paints[index].stock}`)
    paints[index].stock = newStock
    storage.savePaints(paints)
    return paints[index]
  },

  checkPaintsAvailable(paintIds) {
    const problems = []
    paintIds.forEach(pid => {
      const paint = this.getPaintById(pid)
      if (!paint) {
        problems.push(`颜料ID:${pid} 不存在`)
      } else if (paint.stock <= 0) {
        problems.push(`${paint.name} 库存为0`)
      } else if (paint.stock <= paint.threshold) {
        problems.push(`${paint.name} 库存不足（剩余${paint.stock}${paint.unit}，低于阈值${paint.threshold}${paint.unit}）`)
      }
    })
    return problems
  },
}

export const bookingService = {
  getAllBookings() {
    return storage.getBookings()
  },

  getBookingsByStudent(studentId) {
    return storage.getBookings().filter(b => b.studentId === studentId)
  },

  getBookingsByDate(date) {
    return storage.getBookings().filter(b => b.date === date)
  },

  getBookingById(bookingId) {
    return storage.getBookings().find(b => b.id === bookingId)
  },

  getOccupiedSeats(date, timeSlot) {
    const bookings = storage.getBookings()
    return bookings
      .filter(b => b.date === date && b.timeSlot === timeSlot && b.status === BOOKING_STATUS.BOOKED)
      .map(b => b.seatId)
  },

  validateBooking(bookingData, excludeBookingId = null) {
    const errors = []

    if (!bookingData.seatId) errors.push('请选择座位')
    if (!bookingData.date) errors.push('请选择日期')
    if (!bookingData.timeSlot) errors.push('请选择时段')
    if (!bookingData.course) errors.push('请选择课程')
    if (!bookingData.studentId) errors.push('学员信息缺失')
    if (!bookingData.studentName) errors.push('学员姓名缺失')

    const seats = storage.getSeats()
    const seat = seats.find(s => s.id === bookingData.seatId)
    if (seat) {
      if (!seat.isActive) errors.push('该座位已停用')
      if (seat.cleanStatus !== CLEAN_STATUS.CLEANED) {
        errors.push('该座位尚未清洁完成，不能预约')
      }
    }

    const paintIssues = paintService.checkPaintsAvailable(bookingData.paintIds || [])
    if (paintIssues.length > 0) {
      errors.push(...paintIssues)
    }

    if (bookingData.seatId && bookingData.date && bookingData.timeSlot) {
      const occupied = this.getOccupiedSeats(bookingData.date, bookingData.timeSlot)
      const isExcluded = excludeBookingId && occupied.includes(bookingData.seatId)
      const existingBooking = excludeBookingId
        ? storage.getBookings().find(
            b => b.seatId === bookingData.seatId &&
                 b.date === bookingData.date &&
                 b.timeSlot === bookingData.timeSlot &&
                 b.status === BOOKING_STATUS.BOOKED &&
                 b.id !== excludeBookingId
          )
        : occupied.includes(bookingData.seatId)

      if (existingBooking) {
        errors.push('该座位在此时段已被预约')
      }
    }

    return errors
  },

  createBooking(bookingData) {
    const errors = this.validateBooking(bookingData)
    if (errors.length > 0) throw new Error(errors.join('；'))

    const bookings = storage.getBookings()
    const newBooking = {
      id: generateId('B'),
      seatId: bookingData.seatId,
      studentId: bookingData.studentId,
      studentName: bookingData.studentName,
      date: bookingData.date,
      timeSlot: bookingData.timeSlot,
      course: bookingData.course,
      paintIds: bookingData.paintIds || [],
      status: BOOKING_STATUS.BOOKED,
      workSubmitted: false,
      workId: null,
      createTime: new Date().toISOString(),
    }
    bookings.push(newBooking)
    storage.saveBookings(bookings)
    return newBooking
  },

  updateBooking(bookingId, updates) {
    const bookings = storage.getBookings()
    const index = bookings.findIndex(b => b.id === bookingId)
    if (index === -1) throw new Error('预约不存在')

    const original = bookings[index]

    if (original.workSubmitted && (updates.date || updates.timeSlot || updates.seatId)) {
      throw new Error('作品已提交，不能修改预约时间和座位')
    }

    const merged = { ...original, ...updates }
    const errors = this.validateBooking(merged, bookingId)
    if (errors.length > 0) throw new Error(errors.join('；'))

    bookings[index] = merged
    storage.saveBookings(bookings)
    return bookings[index]
  },

  cancelBooking(bookingId) {
    const bookings = storage.getBookings()
    const index = bookings.findIndex(b => b.id === bookingId)
    if (index === -1) throw new Error('预约不存在')

    if (bookings[index].workSubmitted) {
      throw new Error('作品已提交，不能取消预约')
    }

    bookings[index].status = BOOKING_STATUS.CANCELLED
    storage.saveBookings(bookings)
    return bookings[index]
  },

  completeBooking(bookingId) {
    const bookings = storage.getBookings()
    const index = bookings.findIndex(b => b.id === bookingId)
    if (index === -1) throw new Error('预约不存在')
    bookings[index].status = BOOKING_STATUS.COMPLETED
    storage.saveBookings(bookings)
    return bookings[index]
  },

  markWorkSubmitted(bookingId, workId) {
    const bookings = storage.getBookings()
    const index = bookings.findIndex(b => b.id === bookingId)
    if (index === -1) throw new Error('预约不存在')
    bookings[index].workSubmitted = true
    bookings[index].workId = workId
    bookings[index].status = BOOKING_STATUS.COMPLETED
    storage.saveBookings(bookings)
    return bookings[index]
  },
}

export const workService = {
  getAllWorks() {
    return storage.getWorks()
  },

  getWorksByStudent(studentId) {
    return storage.getWorks().filter(w => w.studentId === studentId)
  },

  getWorkById(workId) {
    return storage.getWorks().find(w => w.id === workId)
  },

  getWorkByBookingId(bookingId) {
    return storage.getWorks().find(w => w.bookingId === bookingId)
  },

  submitWork(workData) {
    const works = storage.getWorks()
    const newWork = {
      id: generateId('W'),
      bookingId: workData.bookingId,
      studentId: workData.studentId,
      studentName: workData.studentName,
      title: workData.title,
      description: workData.description || '',
      submitTime: new Date().toISOString(),
      teacherComment: '',
      score: null,
      reviewStatus: 'pending',
      imageUrl: workData.imageUrl || '',
    }
    works.push(newWork)
    storage.saveWorks(works)
    bookingService.markWorkSubmitted(workData.bookingId, newWork.id)
    return newWork
  },

  reviewWork(workId, { teacherComment, score }) {
    const works = storage.getWorks()
    const index = works.findIndex(w => w.id === workId)
    if (index === -1) throw new Error('作品不存在')
    works[index].teacherComment = teacherComment || works[index].teacherComment
    works[index].score = score !== undefined ? score : works[index].score
    works[index].reviewStatus = 'reviewed'
    storage.saveWorks(works)
    return works[index]
  },
}
