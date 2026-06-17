import React, { useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { bookingService, seatService, paintService, workService } from '../../services/business.js'
import {
  BOOKING_STATUS_TEXT,
  TIME_SLOTS,
  COURSE_LIST,
  CLEAN_STATUS,
  BOOKING_STATUS,
} from '../../data/storage.js'

export default function MyBookings() {
  const { bookings, seats, paints, currentStudent, refreshBookings, refreshAll, showNotification } = useApp()
  const [editingBooking, setEditingBooking] = useState(null)
  const [editForm, setEditForm] = useState(null)
  const [submittingBooking, setSubmittingBooking] = useState(null)
  const [workForm, setWorkForm] = useState({ title: '', description: '' })
  const [filter, setFilter] = useState('all')

  const myBookings = bookings
    .filter(b => b.studentId === currentStudent.id)
    .sort((a, b) => new Date(b.createTime) - new Date(a.createTime))

  const filteredBookings = myBookings.filter(b => {
    if (filter === 'booked') return b.status === BOOKING_STATUS.BOOKED
    if (filter === 'completed') return b.status === BOOKING_STATUS.COMPLETED
    if (filter === 'cancelled') return b.status === BOOKING_STATUS.CANCELLED
    if (filter === 'pendingWork') return b.status === BOOKING_STATUS.COMPLETED && !b.workSubmitted
    return true
  })

  const getSeat = (id) => seats.find(s => s.id === id)
  const getPaint = (id) => paints.find(p => p.id === id)

  const handleCancel = (bookingId) => {
    if (!confirm('确定要取消此预约吗？')) return
    try {
      bookingService.cancelBooking(bookingId)
      refreshBookings()
      showNotification('预约已取消', 'success')
    } catch (err) {
      showNotification(err.message, 'error')
    }
  }

  const handleOpenEdit = (booking) => {
    setEditingBooking(booking)
    setEditForm({
      date: booking.date,
      timeSlot: booking.timeSlot,
      seatId: booking.seatId,
      course: booking.course,
      paintIds: [...booking.paintIds],
    })
  }

  const handleCloseEdit = () => {
    setEditingBooking(null)
    setEditForm(null)
  }

  const availableSeatsForEdit = () => {
    if (!editForm) return []
    const occupied = bookingService.getOccupiedSeats(editForm.date, editForm.timeSlot)
      .filter(sid => sid !== editingBooking?.seatId)
    return seats.filter(s =>
      s.isActive &&
      s.cleanStatus === CLEAN_STATUS.CLEANED &&
      !occupied.includes(s.id)
    )
  }

  const handleEditSubmit = (e) => {
    e.preventDefault()
    try {
      bookingService.updateBooking(editingBooking.id, editForm)
      refreshBookings()
      showNotification('预约修改成功', 'success')
      handleCloseEdit()
    } catch (err) {
      showNotification(err.message, 'error')
    }
  }

  const handleOpenSubmitWork = (booking) => {
    setSubmittingBooking(booking)
    setWorkForm({ title: '', description: '' })
  }

  const handleCloseSubmitWork = () => {
    setSubmittingBooking(null)
    setWorkForm({ title: '', description: '' })
  }

  const handleWorkSubmit = (e) => {
    e.preventDefault()
    if (!workForm.title.trim()) {
      showNotification('请输入作品标题', 'error')
      return
    }
    try {
      workService.submitWork({
        bookingId: submittingBooking.id,
        studentId: currentStudent.id,
        studentName: currentStudent.name,
        title: workForm.title,
        description: workForm.description,
      })
      refreshAll()
      showNotification('作品提交成功！', 'success')
      handleCloseSubmitWork()
    } catch (err) {
      showNotification(err.message, 'error')
    }
  }

  const handlePaintToggleInEdit = (paintId) => {
    if (!editForm) return
    const newIds = editForm.paintIds.includes(paintId)
      ? editForm.paintIds.filter(id => id !== paintId)
      : [...editForm.paintIds, paintId]
    setEditForm({ ...editForm, paintIds: newIds })
  }

  return (
    <div className="module-container">
      <div className="module-header">
        <h2 className="module-title">我的预约</h2>
        <div className="filter-tabs">
          {[
            { key: 'all', label: '全部' },
            { key: 'booked', label: '已预约' },
            { key: 'completed', label: '已完成' },
            { key: 'pendingWork', label: '待交作品' },
            { key: 'cancelled', label: '已取消' },
          ].map(tab => (
            <button
              key={tab.key}
              className={`tab-btn ${filter === tab.key ? 'active' : ''}`}
              onClick={() => setFilter(tab.key)}
            >
              {tab.label}
              {tab.key !== 'all' && (
                <span className="tab-count">
                  {myBookings.filter(b =>
                    tab.key === 'booked' ? b.status === BOOKING_STATUS.BOOKED :
                    tab.key === 'completed' ? b.status === BOOKING_STATUS.COMPLETED :
                    tab.key === 'pendingWork' ? (b.status === BOOKING_STATUS.COMPLETED && !b.workSubmitted) :
                    b.status === BOOKING_STATUS.CANCELLED
                  ).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {filteredBookings.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>暂无预约记录</h3>
          <p className="muted-text">去创建一个新的预约吧！</p>
        </div>
      ) : (
        <div className="booking-list">
          {filteredBookings.map(booking => {
            const seat = getSeat(booking.seatId)
            const bookingPaints = booking.paintIds.map(id => getPaint(id)).filter(Boolean)
            const canEdit = booking.status === BOOKING_STATUS.BOOKED && !booking.workSubmitted
            const canCancel = booking.status === BOOKING_STATUS.BOOKED && !booking.workSubmitted
            const canSubmitWork = booking.status === BOOKING_STATUS.COMPLETED && !booking.workSubmitted
            const editDisabledReason = booking.workSubmitted
              ? '作品已提交，不能修改'
              : null

            return (
              <div key={booking.id} className={`booking-card card status-${booking.status}`}>
                <div className="booking-header">
                  <div className="booking-info-main">
                    <div className="booking-course">{booking.course}</div>
                    <div className="booking-time">
                      📅 {booking.date} &nbsp; ⏰ {booking.timeSlot}
                    </div>
                    <div className="booking-seat">
                      💺 {seat ? `${seat.name}（${seat.location || '未设位置'}）` : '座位已删除'}
                    </div>
                  </div>
                  <div className="booking-status">
                    <span className={`tag tag-${booking.status}`}>
                      {BOOKING_STATUS_TEXT[booking.status]}
                    </span>
                    {booking.workSubmitted && (
                      <span className="tag tag-info">已交作品</span>
                    )}
                    {!booking.workSubmitted && booking.status === BOOKING_STATUS.COMPLETED && (
                      <span className="tag tag-warning">待交作品</span>
                    )}
                  </div>
                </div>

                {bookingPaints.length > 0 && (
                  <div className="booking-paints">
                    <span className="muted-text-sm">🎨 颜料清单：</span>
                    <div className="paint-tags">
                      {bookingPaints.map(paint => (
                        <span key={paint.id} className="paint-tag">
                          <span
                            className="paint-tag-color"
                            style={{ backgroundColor: paint.color, border: '1px solid #ddd' }}
                          />
                          {paint.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="booking-footer">
                  <span className="muted-text-sm">预约编号：{booking.id}</span>
                  <div className="action-group">
                    {canSubmitWork && (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleOpenSubmitWork(booking)}
                      >
                        提交作品
                      </button>
                    )}
                    {canEdit && (
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleOpenEdit(booking)}
                        disabled={!!editDisabledReason}
                        title={editDisabledReason}
                      >
                        修改
                      </button>
                    )}
                    {canCancel && (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleCancel(booking.id)}
                      >
                        取消
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {editingBooking && editForm && (
        <div className="modal-overlay" onClick={handleCloseEdit}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>修改预约</h3>
              <button className="close-btn" onClick={handleCloseEdit}>×</button>
            </div>
            {editingBooking.workSubmitted && (
              <div className="alert alert-warning" style={{ margin: '16px' }}>
                ⚠ 作品已提交，不能修改日期、时段和座位
              </div>
            )}
            <form className="modal-body" onSubmit={handleEditSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>日期</label>
                  <input
                    type="date"
                    className="input"
                    value={editForm.date}
                    disabled={editingBooking.workSubmitted}
                    onChange={e => setEditForm({ ...editForm, date: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>时段</label>
                  <select
                    className="input"
                    value={editForm.timeSlot}
                    disabled={editingBooking.workSubmitted}
                    onChange={e => setEditForm({ ...editForm, timeSlot: e.target.value })}
                  >
                    {TIME_SLOTS.map(slot => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>课程</label>
                <select
                  className="input"
                  value={editForm.course}
                  onChange={e => setEditForm({ ...editForm, course: e.target.value })}
                >
                  {COURSE_LIST.map(course => (
                    <option key={course} value={course}>{course}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>座位 {!editingBooking.workSubmitted && `（当前可选 ${availableSeatsForEdit().length} 个）`}</label>
                <select
                  className="input"
                  value={editForm.seatId}
                  disabled={editingBooking.workSubmitted}
                  onChange={e => setEditForm({ ...editForm, seatId: e.target.value })}
                >
                  {!editingBooking.workSubmitted && availableSeatsForEdit().map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} - {s.location || '未设位置'}
                    </option>
                  ))}
                  {editingBooking.workSubmitted && seats.filter(s => s.id === editForm.seatId).map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} - {s.location || '未设位置'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>颜料</label>
                <div className="paint-tags-edit">
                  {paints.map(paint => {
                    const checked = editForm.paintIds.includes(paint.id)
                    const disabled = paint.stock <= 0
                    return (
                      <label
                        key={paint.id}
                        className={`paint-check ${checked ? 'checked' : ''} ${disabled ? 'disabled' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={disabled}
                          onChange={() => !disabled && handlePaintToggleInEdit(paint.id)}
                        />
                        <span
                          className="color-swatch-sm"
                          style={{ backgroundColor: paint.color, border: '1px solid #ddd' }}
                        />
                        <span>{paint.name}</span>
                        {disabled && <span className="muted-text-sm">（缺货）</span>}
                      </label>
                    )
                  })}
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseEdit}>
                  取消
                </button>
                <button type="submit" className="btn btn-primary">
                  保存修改
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {submittingBooking && (
        <div className="modal-overlay" onClick={handleCloseSubmitWork}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>提交作品</h3>
              <button className="close-btn" onClick={handleCloseSubmitWork}>×</button>
            </div>
            <form className="modal-body" onSubmit={handleWorkSubmit}>
              <div className="alert alert-info" style={{ marginBottom: '16px' }}>
                课程：{submittingBooking.course} | 日期：{submittingBooking.date} {submittingBooking.timeSlot}
              </div>
              <div className="form-group">
                <label>作品标题 *</label>
                <input
                  type="text"
                  className="input"
                  value={workForm.title}
                  onChange={e => setWorkForm({ ...workForm, title: e.target.value })}
                  placeholder="为你的作品起个名字"
                />
              </div>
              <div className="form-group">
                <label>作品描述</label>
                <textarea
                  className="input"
                  rows="4"
                  value={workForm.description}
                  onChange={e => setWorkForm({ ...workForm, description: e.target.value })}
                  placeholder="描述创作思路、使用的技法等..."
                />
              </div>
              <div className="alert alert-warning">
                ⚠ 作品提交后，将无法再修改此预约信息，请确认无误后提交。
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseSubmitWork}>
                  取消
                </button>
                <button type="submit" className="btn btn-primary">
                  确认提交
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
