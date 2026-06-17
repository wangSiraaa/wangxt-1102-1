import React, { useState, useMemo } from 'react'
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
  const [showRebookConfirm, setShowRebookConfirm] = useState(null)

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

  const handleOpenRebook = (booking) => {
    setShowRebookConfirm(booking)
  }

  const handleRebook = () => {
    if (!showRebookConfirm) return
    try {
      bookingService.cancelBooking(showRebookConfirm.id)
      refreshBookings()
      showNotification('原预约已取消，请重新预约新的时间', 'info')
      setShowRebookConfirm(null)
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
      paintIds: paintService.getRequiredPaintIdsForCourse(booking.course),
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

  const requiredPaintsForEdit = useMemo(() => {
    if (!editForm) return []
    return paintService.getRequiredPaintsForCourse(editForm.course)
  }, [editForm, paints])

  const requiredPaintStockIssuesForEdit = useMemo(() => {
    if (!editForm) return []
    return paintService.checkRequiredPaintsStock(editForm.course)
  }, [editForm, paints])

  const handleCourseChangeInEdit = (course) => {
    if (!editForm) return
    setEditForm({
      ...editForm,
      course,
      paintIds: paintService.getRequiredPaintIdsForCourse(course),
    })
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
      showNotification('作品提交成功！座位已标记为待清洁', 'success')
      handleCloseSubmitWork()
    } catch (err) {
      showNotification(err.message, 'error')
    }
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
                    {booking.extraFeeRequired && (
                      <span className="tag tag-danger">待补缴 ¥{booking.extraFeeAmount}</span>
                    )}
                  </div>
                </div>

                {bookingPaints.length > 0 && (
                  <div className="booking-paints">
                    <span className="muted-text-sm">🎨 课程必需颜料：</span>
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

                {booking.paintUsage && booking.paintUsage.length > 0 && (
                  <div className="booking-usage">
                    <span className="muted-text-sm">📦 材料耗用：</span>
                    <div className="usage-tags">
                      {booking.paintUsage.map(u => {
                        const p = getPaint(u.paintId)
                        return p ? (
                          <span key={u.paintId} className="usage-tag">
                            {p.name} × {u.amount}{p.unit}
                          </span>
                        ) : null
                      })}
                    </div>
                  </div>
                )}

                {booking.workSubmitted && (
                  <div className="booking-lock-info">
                    <div className="alert alert-info" style={{ margin: 0, padding: '8px 12px' }}>
                      🔒 作品已提交，预约信息已锁定。如需调整时间，请取消后重新预约。
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
                    {booking.workSubmitted && (
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => handleOpenRebook(booking)}
                      >
                        🔄 改期（取消重约）
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
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>修改预约</h3>
              <button className="close-btn" onClick={handleCloseEdit}>×</button>
            </div>
            {editingBooking.workSubmitted && (
              <div className="alert alert-warning" style={{ margin: '16px' }}>
                ⚠ 作品已提交，不能修改日期、时段和座位
              </div>
            )}
            {requiredPaintStockIssuesForEdit.length > 0 && !editingBooking.workSubmitted && (
              <div className="alert alert-danger" style={{ margin: '16px' }}>
                <strong>⛔ 提示：</strong>修改后课程的必需颜料存在问题：
                <ul style={{ margin: '8px 0 0 20px', padding: 0 }}>
                  {requiredPaintStockIssuesForEdit.map((msg, idx) => (
                    <li key={idx} style={{ marginBottom: '4px' }}>{msg}</li>
                  ))}
                </ul>
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
                  onChange={e => handleCourseChangeInEdit(e.target.value)}
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
                <label>
                  🎨 课程必需颜料清单
                  <span className="muted-text" style={{ marginLeft: '8px' }}>
                    （系统自动分配，共 {requiredPaintsForEdit.length} 种）
                  </span>
                </label>
                <div className="required-paints-box">
                  {requiredPaintsForEdit.length === 0 ? (
                    <div className="empty-hint">该课程暂未配置必需颜料，请联系管理员</div>
                  ) : (
                    <div className="paint-tags paint-tags-required">
                      {requiredPaintsForEdit.map(paint => {
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

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseEdit}>
                  取消
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={requiredPaintStockIssuesForEdit.length > 0 && !editingBooking.workSubmitted}
                >
                  {requiredPaintStockIssuesForEdit.length > 0 ? '必需颜料库存不足，无法保存' : '保存修改'}
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
                ⚠ 作品提交后，座位将自动标记为待清洁，且预约信息将被锁定，无法再修改时间。如需调整时间，请先不要提交作品。
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

      {showRebookConfirm && (
        <div className="modal-overlay" onClick={() => setShowRebookConfirm(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>改期确认</h3>
              <button className="close-btn" onClick={() => setShowRebookConfirm(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="alert alert-warning">
                <p>由于作品已提交，预约信息已锁定，无法直接修改时间。</p>
                <p>如需改期，请先取消此预约，然后重新预约新的时间。</p>
              </div>
              <div className="booking-info-summary">
                <p><strong>当前预约：</strong></p>
                <p>课程：{showRebookConfirm.course}</p>
                <p>时间：{showRebookConfirm.date} {showRebookConfirm.timeSlot}</p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowRebookConfirm(null)}
                >
                  我再想想
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleRebook}
                >
                  取消原预约并重新预约
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
