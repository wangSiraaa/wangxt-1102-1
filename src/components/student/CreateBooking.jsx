import React, { useState, useMemo } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { bookingService, paintService, paintPackageService } from '../../services/business.js'
import { TIME_SLOTS, COURSE_LIST, CLEAN_STATUS } from '../../data/storage.js'

export default function CreateBooking() {
  const { seats, paints, paintPackages, currentStudent, refreshBookings, refreshSeats, showNotification } = useApp()

  const today = new Date().toISOString().split('T')[0]

  const [formData, setFormData] = useState({
    date: today,
    timeSlot: TIME_SLOTS[0],
    seatId: '',
    course: COURSE_LIST[0],
    paintPackageId: '',
    paintIds: [],
  })

  const [showPaintPicker, setShowPaintPicker] = useState(false)
  const [paintMode, setPaintMode] = useState('package')

  const availablePackages = useMemo(() => {
    return paintPackages.filter(p =>
      p.isActive && p.applicableCourses && p.applicableCourses.includes(formData.course)
    )
  }, [paintPackages, formData.course])

  const selectedPackage = useMemo(() => {
    if (!formData.paintPackageId) return null
    return paintPackages.find(p => p.id === formData.paintPackageId)
  }, [paintPackages, formData.paintPackageId])

  const selectedPaintsDetail = useMemo(() => {
    if (formData.paintPackageId && selectedPackage) {
      return selectedPackage.paintIds.map(id => paints.find(p => p.id === id)).filter(Boolean)
    }
    return paints.filter(p => formData.paintIds.includes(p.id))
  }, [paints, formData.paintIds, formData.paintPackageId, selectedPackage])

  const availableSeats = useMemo(() => {
    const occupied = bookingService.getOccupiedSeats(formData.date, formData.timeSlot)
    return seats.filter(s => {
      const isActiveAndClean = s.isActive && s.cleanStatus === CLEAN_STATUS.CLEANED
      const isNotOccupied = !occupied.includes(s.id)
      return isActiveAndClean && isNotOccupied
    })
  }, [seats, formData.date, formData.timeSlot])

  const lowStockPaints = useMemo(() => {
    return paints.filter(p => p.stock <= p.threshold)
  }, [paints])

  const handleCourseChange = (course) => {
    setFormData(prev => {
      const newData = { ...prev, course }
      const pkgForCourse = paintPackages.find(p =>
        p.isActive && p.applicableCourses && p.applicableCourses.includes(course)
      )
      if (pkgForCourse) {
        newData.paintPackageId = pkgForCourse.id
        newData.paintIds = []
      } else {
        newData.paintPackageId = ''
      }
      return newData
    })
  }

  const handlePackageSelect = (packageId) => {
    setFormData(prev => ({
      ...prev,
      paintPackageId: packageId,
      paintIds: [],
    }))
  }

  const handlePaintToggle = (paintId) => {
    let newIds
    if (formData.paintIds.includes(paintId)) {
      newIds = formData.paintIds.filter(id => id !== paintId)
    } else {
      newIds = [...formData.paintIds, paintId]
    }
    setFormData({ ...formData, paintIds: newIds, paintPackageId: '' })
  }

  const handleSwitchMode = (mode) => {
    setPaintMode(mode)
    if (mode === 'package' && availablePackages.length > 0) {
      setFormData(prev => ({ ...prev, paintPackageId: availablePackages[0].id, paintIds: [] }))
    } else if (mode === 'custom') {
      setFormData(prev => ({ ...prev, paintPackageId: '' }))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    try {
      bookingService.createBooking({
        ...formData,
        studentId: currentStudent.id,
        studentName: currentStudent.name,
      })
      refreshBookings()
      refreshSeats()
      showNotification('预约成功！', 'success')
      setFormData({
        date: today,
        timeSlot: TIME_SLOTS[0],
        seatId: '',
        course: COURSE_LIST[0],
        paintPackageId: '',
        paintIds: [],
      })
      setPaintMode('package')
    } catch (err) {
      showNotification(err.message, 'error')
    }
  }

  return (
    <div className="module-container">
      <div className="module-header">
        <h2 className="module-title">创建预约</h2>
        <span className="muted-text">当前学员：{currentStudent.name}（ID: {currentStudent.id}）</span>
      </div>

      {lowStockPaints.length > 0 && (
        <div className="alert alert-warning">
          <strong>⚠ 提示：</strong>以下颜料库存不足，可能影响预约：
          {lowStockPaints.map(p => (
            <span key={p.id} className="alert-tag">
              {p.name}（剩{p.stock}{p.unit}）
            </span>
          ))}
        </div>
      )}

      <form className="booking-form card" onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>日期 *</label>
            <input
              type="date"
              className="input"
              value={formData.date}
              min={today}
              onChange={e => setFormData({ ...formData, date: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>时段 *</label>
            <select
              className="input"
              value={formData.timeSlot}
              onChange={e => setFormData({ ...formData, timeSlot: e.target.value })}
            >
              {TIME_SLOTS.map(slot => (
                <option key={slot} value={slot}>{slot}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>课程类型 *</label>
          <select
            className="input"
            value={formData.course}
            onChange={e => handleCourseChange(e.target.value)}
          >
            {COURSE_LIST.map(course => (
              <option key={course} value={course}>{course}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>
            选择座位 *
            <span className="muted-text" style={{ marginLeft: '8px' }}>
              （当前可选：{availableSeats.length} 个座位）
            </span>
          </label>
          {availableSeats.length === 0 ? (
            <div className="empty-hint">
              该时段没有可用座位，请更换日期或时段
            </div>
          ) : (
            <div className="seat-grid">
              {seats.map(seat => {
                const isAvailable = availableSeats.some(s => s.id === seat.id)
                const isSelected = formData.seatId === seat.id
                return (
                  <div
                    key={seat.id}
                    className={`seat-option ${isSelected ? 'selected' : ''} ${isAvailable ? '' : 'disabled'}`}
                    onClick={() => isAvailable && setFormData({ ...formData, seatId: seat.id })}
                  >
                    <div className="seat-option-name">{seat.name}</div>
                    <div className="seat-option-loc">{seat.location}</div>
                    {!isAvailable && (
                      <div className="seat-option-status">
                        {!seat.isActive ? '已停用' :
                          seat.cleanStatus !== CLEAN_STATUS.CLEANED ? '待清洁' : '已被预约'}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="form-group">
          <label>颜料选择</label>
          <div className="paint-mode-switch">
            <button
              type="button"
              className={`paint-mode-btn ${paintMode === 'package' ? 'active' : ''}`}
              onClick={() => handleSwitchMode('package')}
            >
              📦 颜料套餐
            </button>
            <button
              type="button"
              className={`paint-mode-btn ${paintMode === 'custom' ? 'active' : ''}`}
              onClick={() => handleSwitchMode('custom')}
            >
              🎨 自选颜料
            </button>
          </div>

          {paintMode === 'package' && (
            <div className="package-selector">
              {availablePackages.length === 0 ? (
                <div className="empty-hint">该课程暂无可用颜料套餐，可切换到"自选颜料"</div>
              ) : (
                <div className="package-grid">
                  {availablePackages.map(pkg => {
                    const isSelected = formData.paintPackageId === pkg.id
                    const pkgPaints = pkg.paintIds.map(id => paints.find(p => p.id === id)).filter(Boolean)
                    return (
                      <div
                        key={pkg.id}
                        className={`package-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => handlePackageSelect(pkg.id)}
                      >
                        <div className="package-header">
                          <div className="package-name">{pkg.name}</div>
                          <div className="package-price">¥{pkg.price}</div>
                        </div>
                        <div className="package-desc muted-text-sm">{pkg.description}</div>
                        <div className="package-paints">
                          {pkgPaints.slice(0, 4).map(p => (
                            <span key={p.id} className="paint-tag paint-tag-xs">
                              <span className="paint-tag-color" style={{ backgroundColor: p.color, border: '1px solid #ddd' }} />
                              {p.name}
                            </span>
                          ))}
                          {pkgPaints.length > 4 && (
                            <span className="muted-text-sm">+{pkgPaints.length - 4}</span>
                          )}
                        </div>
                        <div className="package-count muted-text-sm">
                          含 {pkgPaints.length} 种颜料 × {pkg.includedAmount}{pkgPaints[0]?.unit || '管'}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {paintMode === 'custom' && (
            <div
              className="paint-selected-area"
              onClick={() => setShowPaintPicker(true)}
            >
              {selectedPaintsDetail.length === 0 ? (
                <span className="muted-text">点击选择需要使用的颜料（可选）</span>
              ) : (
                <div className="paint-tags">
                  {selectedPaintsDetail.map(paint => (
                    <span key={paint.id} className="paint-tag">
                      <span
                        className="paint-tag-color"
                        style={{ backgroundColor: paint.color, border: '1px solid #ddd' }}
                      />
                      {paint.name}
                      <span
                        className="paint-tag-remove"
                        onClick={(e) => {
                          e.stopPropagation()
                          handlePaintToggle(paint.id)
                        }}
                      >
                        ×
                      </span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary btn-lg" disabled={availableSeats.length === 0}>
            确认预约
          </button>
        </div>
      </form>

      {showPaintPicker && (
        <div className="modal-overlay" onClick={() => setShowPaintPicker(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>选择颜料</h3>
              <button className="close-btn" onClick={() => setShowPaintPicker(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="paint-grid">
                {paints.map(paint => {
                  const checked = formData.paintIds.includes(paint.id)
                  const isLowStock = paint.stock <= paint.threshold
                  const isOutOfStock = paint.stock <= 0
                  return (
                    <label
                      key={paint.id}
                      className={`paint-item ${checked ? 'checked' : ''} ${isOutOfStock ? 'disabled' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={isOutOfStock}
                        onChange={() => !isOutOfStock && handlePaintToggle(paint.id)}
                      />
                      <div className="paint-item-body">
                        <div className="paint-item-head">
                          <div
                            className="color-swatch-lg"
                            style={{ backgroundColor: paint.color, border: '1px solid #ddd' }}
                          />
                          <div>
                            <div className="paint-item-name">{paint.name}</div>
                            <div className="muted-text-sm">库存：{paint.stock}{paint.unit}</div>
                          </div>
                        </div>
                        {isOutOfStock && <span className="tag tag-danger">缺货</span>}
                        {isLowStock && !isOutOfStock && <span className="tag tag-warning">库存不足</span>}
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setShowPaintPicker(false)}>
                确定选择
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
