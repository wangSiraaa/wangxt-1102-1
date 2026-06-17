import React, { useState, useMemo } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { bookingService, paintService } from '../../services/business.js'
import { TIME_SLOTS, COURSE_LIST, CLEAN_STATUS } from '../../data/storage.js'

export default function CreateBooking() {
  const { seats, paints, currentStudent, refreshBookings, refreshSeats, showNotification } = useApp()

  const today = new Date().toISOString().split('T')[0]

  const [formData, setFormData] = useState({
    date: today,
    timeSlot: TIME_SLOTS[0],
    seatId: '',
    course: COURSE_LIST[0],
  })

  const requiredPaints = useMemo(() => {
    return paintService.getRequiredPaintsForCourse(formData.course)
  }, [paints, formData.course])

  const requiredPaintStockStatus = useMemo(() => {
    return paintService.checkRequiredPaintsStock(formData.course)
  }, [paints, formData.course])

  const isCoursePaintable = useMemo(() => {
    const result = paintService.checkCoursePaintable(formData.course)
    return result.paintable
  }, [paints, formData.course])

  const coursePaintingInfo = useMemo(() => {
    return paintService.checkCoursePaintable(formData.course)
  }, [paints, formData.course])

  const availableSeats = useMemo(() => {
    const occupied = bookingService.getOccupiedSeats(formData.date, formData.timeSlot)
    return seats.filter(s => {
      const isActiveAndClean = s.isActive && s.cleanStatus === CLEAN_STATUS.CLEANED
      const isNotOccupied = !occupied.includes(s.id)
      return isActiveAndClean && isNotOccupied
    })
  }, [seats, formData.date, formData.timeSlot])

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
      showNotification('预约成功！课程必需颜料已自动分配。', 'success')
      setFormData({
        date: today,
        timeSlot: TIME_SLOTS[0],
        seatId: '',
        course: COURSE_LIST[0],
      })
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

      {requiredPaintStockStatus.length > 0 && (
        <div className="alert alert-danger">
          <strong>⛔ 预约拦截：</strong> 所选课程的必需颜料存在问题，暂时无法预约：
          <ul style={{ margin: '8px 0 0 20px', padding: 0 }}>
            {requiredPaintStockStatus.map((msg, idx) => (
              <li key={idx} style={{ marginBottom: '4px' }}>{msg}</li>
            ))}
          </ul>
        </div>
      )}

      {requiredPaintStockStatus.length === 0 && requiredPaints.some(p => p.stock <= p.threshold * 1.5) && (
        <div className="alert alert-warning">
          <strong>⚠ 提示：</strong> 以下课程必需颜料库存偏低，请尽快预约：
          {requiredPaints.filter(p => p.stock <= p.threshold * 1.5).map(p => (
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
            onChange={e => setFormData({ ...formData, course: e.target.value })}
          >
            {COURSE_LIST.map(course => {
              const info = paintService.checkCoursePaintable(course)
              return (
                <option key={course} value={course}>
                  {course} {!info.paintable ? `（❌${info.reason}）` : ''}
                </option>
              )
            })}
          </select>
          {!coursePaintingInfo.paintable && (
            <div className="form-error-message">
              📛 该课程当前无法预约：{coursePaintingInfo.reason}
            </div>
          )}
        </div>

        <div className="form-group">
          <label>
            🎨 课程必需颜料清单
            <span className="muted-text" style={{ marginLeft: '8px' }}>
              （共 {requiredPaints.length} 种，系统自动分配，不可更改）
            </span>
          </label>
          <div className="required-paints-box">
            {requiredPaints.length === 0 ? (
              <div className="empty-hint">该课程暂未配置必需颜料，请联系管理员</div>
            ) : (
              <div className="paint-tags paint-tags-required">
                {requiredPaints.map(paint => {
                  const isLow = paint.stock <= paint.threshold
                  const isOut = paint.stock <= 0
                  return (
                    <span
                      key={paint.id}
                      className={`paint-tag paint-tag-required ${isOut ? 'tag-danger' : isLow ? 'tag-warning' : ''}`}
                    >
                      <span
                        className="paint-tag-color"
                        style={{ backgroundColor: paint.color, border: '1px solid #ddd' }}
                      />
                      <strong>{paint.name}</strong>
                      <span className="paint-tag-stock">
                        库存：{paint.stock}{paint.unit}
                        {isOut && ' ❌缺货'}
                        {!isOut && isLow && ' ⚠不足'}
                      </span>
                    </span>
                  )
                })}
              </div>
            )}
          </div>
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

        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={availableSeats.length === 0 || !isCoursePaintable}
          >
            {!isCoursePaintable ? '必需颜料库存不足，无法预约' :
             availableSeats.length === 0 ? '无可用座位' : '确认预约'}
          </button>
        </div>
      </form>
    </div>
  )
}
