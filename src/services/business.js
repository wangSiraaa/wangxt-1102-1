import { storage, CLEAN_STATUS, BOOKING_STATUS, TIME_SLOTS, INACTIVE_REASON, COURSE_LIST, COURSE_REQUIRED_PAINTS } from '../data/storage.js'

function generateId(prefix) {
  return prefix + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase()
}

export const paintPackageService = {
  getAllPackages() {
    return storage.getPaintPackages()
  },

  getActivePackages() {
    return storage.getPaintPackages().filter(p => p.isActive)
  },

  getPackagesByCourse(course) {
    return storage.getPaintPackages().filter(p =>
      p.isActive && p.applicableCourses && p.applicableCourses.includes(course)
    )
  },

  getPackageById(packageId) {
    return storage.getPaintPackages().find(p => p.id === packageId)
  },

  addPackage(packageData) {
    const packages = storage.getPaintPackages()
    const newPackage = {
      id: generateId('PKG'),
      name: packageData.name,
      description: packageData.description || '',
      paintIds: packageData.paintIds || [],
      includedAmount: Number(packageData.includedAmount) || 1,
      price: Number(packageData.price) || 0,
      applicableCourses: packageData.applicableCourses || [],
      isActive: packageData.isActive !== undefined ? packageData.isActive : true,
    }
    packages.push(newPackage)
    storage.savePaintPackages(packages)
    return newPackage
  },

  updatePackage(packageId, updates) {
    const packages = storage.getPaintPackages()
    const index = packages.findIndex(p => p.id === packageId)
    if (index === -1) throw new Error('颜料套餐不存在')
    packages[index] = { ...packages[index], ...updates }
    storage.savePaintPackages(packages)
    return packages[index]
  },

  deletePackage(packageId) {
    const packages = storage.getPaintPackages()
    const newPackages = packages.filter(p => p.id !== packageId)
    storage.savePaintPackages(newPackages)
  },

  toggleActive(packageId) {
    const pkg = this.getPackageById(packageId)
    if (!pkg) throw new Error('颜料套餐不存在')
    return this.updatePackage(packageId, { isActive: !pkg.isActive })
  },

  checkPackageAvailable(packageId, course = null) {
    const problems = []
    const pkg = this.getPackageById(packageId)
    if (!pkg) {
      problems.push('颜料套餐不存在')
      return problems
    }
    if (!pkg.isActive) {
      problems.push(`${pkg.name} 套餐已停用`)
    }
    if (course && pkg.applicableCourses && !pkg.applicableCourses.includes(course)) {
      problems.push(`${pkg.name} 套餐不适用于「${course}」课程`)
    }
    const paintProblems = paintService.checkPaintsAvailable(pkg.paintIds, course)
    problems.push(...paintProblems)
    return problems
  },

  getPackagePaints(packageId) {
    const pkg = this.getPackageById(packageId)
    if (!pkg) return []
    return pkg.paintIds.map(id => paintService.getPaintById(id)).filter(Boolean)
  },
}

export const seatService = {
  getAllSeats() {
    return storage.getSeats()
  },

  getAvailableSeats() {
    const seats = storage.getSeats()
    return seats.filter(s => s.isActive && s.cleanStatus === CLEAN_STATUS.CLEANED)
  },

  getInactiveSeats() {
    const seats = storage.getSeats()
    return seats.filter(s => !s.isActive)
  },

  addSeat(seatData) {
    const seats = storage.getSeats()
    const newSeat = {
      id: generateId('S'),
      name: seatData.name,
      location: seatData.location || '',
      cleanStatus: CLEAN_STATUS.CLEANED,
      isActive: true,
      inactiveReason: '',
      inactiveNote: '',
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
    const updates = { isActive: !seat.isActive }
    if (seat.isActive) {
      updates.inactiveReason = updates.inactiveReason || INACTIVE_REASON.OTHER
    } else {
      updates.inactiveReason = ''
      updates.inactiveNote = ''
    }
    return this.updateSeat(seatId, updates)
  },

  setInactiveWithReason(seatId, reason, note = '') {
    const validReasons = Object.values(INACTIVE_REASON)
    if (!validReasons.includes(reason)) {
      throw new Error('无效的停用原因')
    }
    return this.updateSeat(seatId, {
      isActive: false,
      inactiveReason: reason,
      inactiveNote: note,
    })
  },

  setActive(seatId) {
    return this.updateSeat(seatId, {
      isActive: true,
      inactiveReason: '',
      inactiveNote: '',
    })
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

  getRestrictedPaints() {
    const paints = storage.getPaints()
    return paints.filter(p => p.restrictedCourses && p.restrictedCourses.length > 0)
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
      restrictedCourses: paintData.restrictedCourses || [],
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

  updateRestrictedCourses(paintId, restrictedCourses) {
    const invalidCourses = restrictedCourses.filter(c => !COURSE_LIST.includes(c))
    if (invalidCourses.length > 0) {
      throw new Error(`无效的课程：${invalidCourses.join('、')}`)
    }
    return this.updatePaint(paintId, { restrictedCourses })
  },

  checkPaintsAvailable(paintIds, course = null) {
    const problems = []
    paintIds.forEach(pid => {
      const paint = this.getPaintById(pid)
      if (!paint) {
        problems.push(`颜料ID:${pid} 不存在`)
      } else {
        if (paint.stock <= 0) {
          problems.push(`${paint.name} 库存为0`)
        } else if (paint.stock <= paint.threshold) {
          problems.push(`${paint.name} 库存不足（剩余${paint.stock}${paint.unit}，低于阈值${paint.threshold}${paint.unit}）`)
        }
        if (course && paint.restrictedCourses && paint.restrictedCourses.includes(course)) {
          problems.push(`${paint.name} 因库存短缺，暂不支持「${course}」课程使用`)
        }
      }
    })
    return problems
  },

  checkPaintsForCourse(paintIds, course) {
    const problems = []
    paintIds.forEach(pid => {
      const paint = this.getPaintById(pid)
      if (paint && paint.restrictedCourses && paint.restrictedCourses.includes(course)) {
        problems.push({
          paintId: pid,
          paintName: paint.name,
          course,
          message: `${paint.name} 因库存短缺，暂不支持「${course}」课程使用`,
        })
      }
    })
    return problems
  },

  checkStockSufficient(paintId, amount) {
    const paint = this.getPaintById(paintId)
    if (!paint) {
      return { sufficient: false, paintId, paintName: paintId, reason: '颜料不存在' }
    }
    if (amount <= 0) {
      return { sufficient: true, paintId, paintName: paint.name }
    }
    if (paint.stock < amount) {
      return {
        sufficient: false,
        paintId,
        paintName: paint.name,
        reason: `${paint.name} 库存不足（当前：${paint.stock}${paint.unit}，需要：${amount}${paint.unit}）`,
        currentStock: paint.stock,
        requiredAmount: amount,
        unit: paint.unit,
      }
    }
    return { sufficient: true, paintId, paintName: paint.name }
  },

  validatePaintUsage(paintUsage) {
    const results = []
    paintUsage.forEach(usage => {
      if (usage.amount > 0) {
        const result = this.checkStockSufficient(usage.paintId, usage.amount)
        if (!result.sufficient) {
          results.push(result)
        }
      }
    })
    return results
  },

  batchUpdateStock(paintUsage, operation = 'consume') {
    const multiplier = operation === 'consume' ? -1 : 1
    const results = []
    paintUsage.forEach(usage => {
      if (usage.amount > 0) {
        const paint = this.updateStock(usage.paintId, multiplier * usage.amount)
        results.push({
          paintId: usage.paintId,
          paintName: paint.name,
          amount: usage.amount,
          remainingStock: paint.stock,
        })
      }
    })
    return results
  },

  verifyStockAfterReview(bookingId, paintUsage) {
    const booking = bookingService.getBookingById(bookingId)
    if (!booking || !booking.paintUsage) {
      return { valid: false, reason: '预约或材料耗用记录不存在' }
    }

    const issues = []
    booking.paintUsage.forEach(usage => {
      if (usage.amount > 0) {
        const paint = this.getPaintById(usage.paintId)
        if (!paint) {
          issues.push(`颜料ID:${usage.paintId} 不存在`)
        }
      }
    })

    const totalUsageAmount = booking.paintUsage.reduce((sum, u) => sum + (u.amount || 0), 0)
    const formUsageAmount = paintUsage.reduce((sum, u) => sum + (u.amount || 0), 0)
    if (Math.abs(totalUsageAmount - formUsageAmount) > 0.001) {
      issues.push(`材料耗用数量不一致（预约记录：${totalUsageAmount}，提交数据：${formUsageAmount}）`)
    }

    if (booking.extraFeeRequired !== undefined && booking.extraFeeAmount !== undefined) {
      if (booking.extraFeeRequired && booking.extraFeeAmount <= 0) {
        issues.push('补缴费用标记为需要，但金额为0')
      }
    }

    return {
      valid: issues.length === 0,
      issues,
      bookingPaintUsage: booking.paintUsage,
      formPaintUsage: paintUsage,
      extraFee: {
        required: booking.extraFeeRequired,
        amount: booking.extraFeeAmount,
        note: booking.extraFeeNote,
      },
    }
  },

  getRequiredPaintIdsForCourse(course) {
    return COURSE_REQUIRED_PAINTS[course] || []
  },

  getRequiredPaintsForCourse(course) {
    const ids = this.getRequiredPaintIdsForCourse(course)
    return ids.map(id => this.getPaintById(id)).filter(Boolean)
  },

  checkRequiredPaintsStock(course) {
    const problems = []
    const requiredIds = this.getRequiredPaintIdsForCourse(course)
    if (requiredIds.length === 0) {
      problems.push(`课程「${course}」未配置必需颜料`)
      return problems
    }
    requiredIds.forEach(pid => {
      const paint = this.getPaintById(pid)
      if (!paint) {
        problems.push(`必需颜料ID:${pid} 不存在，请联系管理员配置`)
      } else if (paint.stock <= 0) {
        problems.push(`📛 必需颜料「${paint.name}」缺货（库存为0），无法预约「${course}」课程`)
      } else if (paint.stock <= paint.threshold) {
        problems.push(`📛 必需颜料「${paint.name}」库存不足（剩余${paint.stock}${paint.unit}，低于阈值${paint.threshold}${paint.unit}），无法预约「${course}」课程`)
      }
    })
    return problems
  },

  checkCoursePaintable(course) {
    const requiredIds = this.getRequiredPaintIdsForCourse(course)
    if (requiredIds.length === 0) return { paintable: false, reason: '课程未配置必需颜料' }
    for (const pid of requiredIds) {
      const paint = this.getPaintById(pid)
      if (!paint) return { paintable: false, reason: `必需颜料ID:${pid} 不存在` }
      if (paint.stock <= 0) return { paintable: false, reason: `必需颜料「${paint.name}」缺货`, paint }
      if (paint.stock <= paint.threshold) return { paintable: false, reason: `必需颜料「${paint.name}」库存不足`, paint }
    }
    return { paintable: true }
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
      if (!seat.isActive) {
        const reasonText = seat.inactiveReason ? `（${seat.inactiveReason === 'repair' ? '维修中' : seat.inactiveReason === 'cleaning' ? '深度清洁中' : '其他原因'}）` : ''
        errors.push(`该座位已停用${reasonText}${seat.inactiveNote ? '：' + seat.inactiveNote : ''}`)
      }
      if (seat.cleanStatus !== CLEAN_STATUS.CLEANED) {
        const statusText = seat.cleanStatus === CLEAN_STATUS.DIRTY ? '待清洁' : '清洁中'
        errors.push(`该座位${statusText}，请等待清洁完成后再预约`)
      }
    }

    if (bookingData.course) {
      const requiredStockIssues = paintService.checkRequiredPaintsStock(bookingData.course)
      if (requiredStockIssues.length > 0) {
        errors.push(...requiredStockIssues)
      }
    }

    if (bookingData.seatId && bookingData.date && bookingData.timeSlot) {
      const occupied = this.getOccupiedSeats(bookingData.date, bookingData.timeSlot)
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

    const requiredPaintIds = paintService.getRequiredPaintIdsForCourse(bookingData.course)

    const bookings = storage.getBookings()
    const newBooking = {
      id: generateId('B'),
      seatId: bookingData.seatId,
      studentId: bookingData.studentId,
      studentName: bookingData.studentName,
      date: bookingData.date,
      timeSlot: bookingData.timeSlot,
      course: bookingData.course,
      paintPackageId: null,
      paintIds: requiredPaintIds,
      status: BOOKING_STATUS.BOOKED,
      workSubmitted: false,
      workId: null,
      paintUsage: [],
      extraFeeRequired: false,
      extraFeeAmount: 0,
      extraFeeNote: '',
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
      throw new Error('作品已提交，不能修改预约时间和座位。如需调整，请先取消此预约后重新预约。')
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
    try {
      seatService.setCleanStatus(bookings[index].seatId, CLEAN_STATUS.DIRTY)
    } catch (e) {
      console.warn('标记座位为待清洁失败:', e.message)
    }
    return bookings[index]
  },

  markWorkSubmitted(bookingId, workId, extraData = {}) {
    const bookings = storage.getBookings()
    const index = bookings.findIndex(b => b.id === bookingId)
    if (index === -1) throw new Error('预约不存在')
    bookings[index].workSubmitted = true
    bookings[index].workId = workId
    bookings[index].status = BOOKING_STATUS.COMPLETED
    if (extraData.paintUsage) {
      bookings[index].paintUsage = extraData.paintUsage
    }
    if (extraData.extraFeeRequired !== undefined) {
      bookings[index].extraFeeRequired = extraData.extraFeeRequired
      bookings[index].extraFeeAmount = extraData.extraFeeAmount || 0
      bookings[index].extraFeeNote = extraData.extraFeeNote || ''
    }
    storage.saveBookings(bookings)
    try {
      seatService.setCleanStatus(bookings[index].seatId, CLEAN_STATUS.DIRTY)
    } catch (e) {
      console.warn('标记座位为待清洁失败:', e.message)
    }
    return bookings[index]
  },

  updateWorkSubmission(bookingId, submissionData) {
    const bookings = storage.getBookings()
    const index = bookings.findIndex(b => b.id === bookingId)
    if (index === -1) throw new Error('预约不存在')

    if (!bookings[index].workSubmitted) {
      throw new Error('该预约尚未提交作品')
    }

    if (submissionData.paintUsage) {
      bookings[index].paintUsage = submissionData.paintUsage
    }
    if (submissionData.extraFeeRequired !== undefined) {
      bookings[index].extraFeeRequired = submissionData.extraFeeRequired
      bookings[index].extraFeeAmount = submissionData.extraFeeAmount || 0
      bookings[index].extraFeeNote = submissionData.extraFeeNote || ''
    }
    storage.saveBookings(bookings)
    return bookings[index]
  },

  calculateExtraFee(paintUsage) {
    let total = 0
    paintUsage.forEach(usage => {
      const paint = paintService.getPaintById(usage.paintId)
      if (paint && usage.amount > 0) {
        total += paint.price * usage.amount
      }
    })
    return Math.round(total * 100) / 100
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

  submitWork(workData, submissionExtra = {}) {
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
    bookingService.markWorkSubmitted(workData.bookingId, newWork.id, submissionExtra)
    return newWork
  },

  reviewWork(workId, reviewData) {
    const works = storage.getWorks()
    const index = works.findIndex(w => w.id === workId)
    if (index === -1) throw new Error('作品不存在')

    works[index].teacherComment = reviewData.teacherComment !== undefined ? reviewData.teacherComment : works[index].teacherComment
    works[index].score = reviewData.score !== undefined ? reviewData.score : works[index].score
    works[index].reviewStatus = 'reviewed'
    storage.saveWorks(works)

    if (reviewData.paintUsage || reviewData.extraFeeRequired !== undefined) {
      const work = works[index]
      bookingService.updateWorkSubmission(work.bookingId, {
        paintUsage: reviewData.paintUsage,
        extraFeeRequired: reviewData.extraFeeRequired,
        extraFeeAmount: reviewData.extraFeeAmount,
        extraFeeNote: reviewData.extraFeeNote,
      })
    }

    return works[index]
  },
}
