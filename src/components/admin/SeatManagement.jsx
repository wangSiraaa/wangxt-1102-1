import React, { useState, useMemo } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { seatService, paintService, bookingService } from '../../services/business.js'
import {
  CLEAN_STATUS,
  CLEAN_STATUS_TEXT,
  INACTIVE_REASON,
  INACTIVE_REASON_TEXT,
  COURSE_LIST,
} from '../../data/storage.js'

export default function SeatManagement() {
  const { seats, paints, bookings, refreshSeats, refreshPaints, showNotification } = useApp()
  const [filter, setFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editingSeat, setEditingSeat] = useState(null)
  const [formData, setFormData] = useState({ name: '', location: '' })
  const [inactiveModal, setInactiveModal] = useState(null)
  const [inactiveForm, setInactiveForm] = useState({ reason: INACTIVE_REASON.REPAIR, note: '' })

  const dirtySeats = seats.filter(s => s.cleanStatus === CLEAN_STATUS.DIRTY)
  const cleaningSeats = seats.filter(s => s.cleanStatus === CLEAN_STATUS.CLEANING)
  const inactiveSeats = seats.filter(s => !s.isActive)
  const restrictedPaints = paints.filter(p => p.restrictedCourses && p.restrictedCourses.length > 0)

  const seatBookings = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    return bookings.filter(b => b.date === today && b.status === 'booked')
  }, [bookings])

  const filteredSeats = seats.filter(s => {
    if (filter === 'available') return s.isActive && s.cleanStatus === CLEAN_STATUS.CLEANED
    if (filter === 'dirty') return s.cleanStatus === CLEAN_STATUS.DIRTY
    if (filter === 'cleaning') return s.cleanStatus === CLEAN_STATUS.CLEANING
    if (filter === 'inactive') return !s.isActive
    return true
  })

  const handleOpenForm = (seat = null) => {
    setEditingSeat(seat)
    setFormData(seat ? { name: seat.name, location: seat.location || '' } : { name: '', location: '' })
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingSeat(null)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      showNotification('请输入座位名称', 'error')
      return
    }
    try {
      if (editingSeat) {
        seatService.updateSeat(editingSeat.id, { name: formData.name, location: formData.location })
        showNotification('座位更新成功', 'success')
      } else {
        seatService.addSeat(formData)
        showNotification('座位添加成功', 'success')
      }
      refreshSeats()
      handleCloseForm()
    } catch (err) {
      showNotification(err.message, 'error')
    }
  }

  const handleDelete = (seatId) => {
    if (!confirm('确定要删除该座位吗？')) return
    try {
      seatService.deleteSeat(seatId)
      refreshSeats()
      showNotification('座位删除成功', 'success')
    } catch (err) {
      showNotification(err.message, 'error')
    }
  }

  const handleSetCleanStatus = (seatId, status) => {
    try {
      seatService.setCleanStatus(seatId, status)
      refreshSeats()
      const statusText = status === CLEAN_STATUS.CLEANED ? '已标记为清洁完成' :
        status === CLEAN_STATUS.CLEANING ? '已开始清洁' : '已标记为待清洁'
      showNotification(statusText, 'success')
    } catch (err) {
      showNotification(err.message, 'error')
    }
  }

  const handleOpenInactive = (seat) => {
    setInactiveModal(seat)
    setInactiveForm({ reason: INACTIVE_REASON.REPAIR, note: seat.inactiveNote || '' })
  }

  const handleSetInactive = () => {
    if (!inactiveModal) return
    try {
      seatService.setInactiveWithReason(inactiveModal.id, inactiveForm.reason, inactiveForm.note)
      refreshSeats()
      showNotification('座位已停用', 'success')
      setInactiveModal(null)
    } catch (err) {
      showNotification(err.message, 'error')
    }
  }

  const handleSetActive = (seatId) => {
    try {
      seatService.setActive(seatId)
      refreshSeats()
      showNotification('座位已恢复使用', 'success')
    } catch (err) {
      showNotification(err.message, 'error')
    }
  }

  const getTodayBookingForSeat = (seatId) => {
    return seatBookings.find(b => b.seatId === seatId)
  }

  const getCleanStatusTagClass = (status) => {
    if (status === CLEAN_STATUS.CLEANED) return 'tag tag-success'
    if (status === CLEAN_STATUS.DIRTY) return 'tag tag-danger'
    if (status === CLEAN_STATUS.CLEANING) return 'tag tag-warning'
    return 'tag'
  }

  return (
    <div className="module-container">
      <div className="module-header">
        <h2 className="module-title">座位管理</h2>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <select
            className="input"
            value={filter}
            onChange={e => setFilter(e.target.value)}
            style={{ width: '150px' }}
          >
            <option value="all">全部座位</option>
            <option value="available">可用</option>
            <option value="dirty">待清洁</option>
            <option value="cleaning">清洁中</option>
            <option value="inactive">已停用</option>
          </select>
          <button className="btn btn-primary" onClick={() => handleOpenForm()}>
            + 添加座位
          </button>
        </div>
      </div>

      {dirtySeats.length > 0 && (
        <div className="alert alert-warning">
          <strong>⚠ 清洁提醒：</strong>以下座位使用后待清洁复位：
          {dirtySeats.map((s, i) => (
            <span key={s.id} className="alert-tag">
              {s.name}{i < dirtySeats.length - 1 ? '、' : ''}
            </span>
          ))}
          <span className="muted-text-sm" style={{ marginLeft: '8px' }}>
            — 学员预约前需确认清洁完成
          </span>
        </div>
      )}

      {inactiveSeats.length > 0 && (
        <div className="alert alert-info">
          <strong>🔒 临时关闭：</strong>以下座位因清洁或维修暂时不可用：
          {inactiveSeats.map((s, i) => (
            <span key={s.id} className="alert-tag">
              {s.name}（{INACTIVE_REASON_TEXT[s.inactiveReason] || '未知'}）{s.inactiveNote ? `：${s.inactiveNote}` : ''}{i < inactiveSeats.length - 1 ? '、' : ''}
            </span>
          ))}
        </div>
      )}

      {restrictedPaints.length > 0 && (
        <div className="alert alert-danger">
          <strong>🎨 颜料限制：</strong>以下颜料因库存短缺仅开放部分课程：
          {restrictedPaints.map((p, i) => (
            <span key={p.id} className="alert-tag">
              {p.name}（仅限：{COURSE_LIST.filter(c => !p.restrictedCourses.includes(c)).join('、') || '无'}）{i < restrictedPaints.length - 1 ? '、' : ''}
            </span>
          ))}
        </div>
      )}

      <div className="stats-row">
        <div className="stat-card stat-blue">
          <div className="stat-number">{seats.length}</div>
          <div className="stat-label">座位总数</div>
        </div>
        <div className="stat-card stat-green">
          <div className="stat-number">{seats.filter(s => s.isActive && s.cleanStatus === CLEAN_STATUS.CLEANED).length}</div>
          <div className="stat-label">可用座位</div>
        </div>
        <div className="stat-card stat-orange">
          <div className="stat-number">{dirtySeats.length}</div>
          <div className="stat-label">待清洁</div>
        </div>
        <div className="stat-card stat-yellow">
          <div className="stat-number">{cleaningSeats.length}</div>
          <div className="stat-label">清洁中</div>
        </div>
        <div className="stat-card stat-red">
          <div className="stat-number">{inactiveSeats.length}</div>
          <div className="stat-label">已停用</div>
        </div>
        <div className="stat-card stat-purple">
          <div className="stat-number">{restrictedPaints.length}</div>
          <div className="stat-label">颜料限制</div>
        </div>
      </div>

      <div className="seat-admin-grid">
        {filteredSeats.map(seat => {
          const todayBooking = getTodayBookingForSeat(seat.id)
          const isDirty = seat.cleanStatus === CLEAN_STATUS.DIRTY
          const isCleaning = seat.cleanStatus === CLEAN_STATUS.CLEANING
          const isCleaned = seat.cleanStatus === CLEAN_STATUS.CLEANED
          const isInactive = !seat.isActive

          return (
            <div key={seat.id} className={`seat-admin-card card ${isInactive ? 'inactive' : ''}`}>
              <div className="seat-admin-header">
                <div>
                  <div className="seat-admin-name">{seat.name}</div>
                  <div className="muted-text-sm">{seat.location || '未设位置'}</div>
                </div>
                <div className="seat-admin-tags">
                  <span className={getCleanStatusTagClass(seat.cleanStatus)}>
                    {CLEAN_STATUS_TEXT[seat.cleanStatus]}
                  </span>
                  {isInactive && (
                    <span className="tag tag-danger">
                      {INACTIVE_REASON_TEXT[seat.inactiveReason] || '已停用'}
                    </span>
                  )}
                </div>
              </div>

              {isInactive && seat.inactiveNote && (
                <div className="seat-admin-note">
                  <span className="muted-text-sm">📝 {seat.inactiveNote}</span>
                </div>
              )}

              {todayBooking && (
                <div className="seat-admin-booking">
                  <span className="muted-text-sm">
                    📅 今日预约：{todayBooking.studentName} · {todayBooking.timeSlot}
                  </span>
                </div>
              )}

              <div className="seat-admin-actions">
                {isDirty && (
                  <button
                    className="btn btn-xs btn-primary"
                    onClick={() => handleSetCleanStatus(seat.id, CLEAN_STATUS.CLEANING)}
                  >
                    🧹 开始清洁
                  </button>
                )}
                {isCleaning && (
                  <button
                    className="btn btn-xs btn-primary"
                    onClick={() => handleSetCleanStatus(seat.id, CLEAN_STATUS.CLEANED)}
                  >
                    ✅ 清洁完成
                  </button>
                )}
                {isCleaned && !isInactive && (
                  <button
                    className="btn btn-xs btn-secondary"
                    onClick={() => handleSetCleanStatus(seat.id, CLEAN_STATUS.DIRTY)}
                  >
                    标记待清洁
                  </button>
                )}
                {!isInactive ? (
                  <button
                    className="btn btn-xs btn-danger"
                    onClick={() => handleOpenInactive(seat)}
                  >
                    停用
                  </button>
                ) : (
                  <button
                    className="btn btn-xs btn-primary"
                    onClick={() => handleSetActive(seat.id)}
                  >
                    恢复使用
                  </button>
                )}
                <button className="btn btn-xs btn-secondary" onClick={() => handleOpenForm(seat)}>
                  编辑
                </button>
                <button className="btn btn-xs btn-danger" onClick={() => handleDelete(seat.id)}>
                  删除
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {filteredSeats.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">💺</div>
          <h3>暂无匹配的座位</h3>
          <p className="muted-text">尝试更换筛选条件或添加新座位</p>
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={handleCloseForm}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingSeat ? '编辑座位' : '添加座位'}</h3>
              <button className="close-btn" onClick={handleCloseForm}>×</button>
            </div>
            <form className="modal-body" onSubmit={handleSubmit}>
              <div className="form-group">
                <label>座位名称 *</label>
                <input
                  type="text"
                  className="input"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="如：7号座位"
                />
              </div>
              <div className="form-group">
                <label>位置</label>
                <input
                  type="text"
                  className="input"
                  value={formData.location}
                  onChange={e => setFormData({ ...formData, location: e.target.value })}
                  placeholder="如：东区A区"
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseForm}>
                  取消
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingSeat ? '保存修改' : '添加'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {inactiveModal && (
        <div className="modal-overlay" onClick={() => setInactiveModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>停用座位 - {inactiveModal.name}</h3>
              <button className="close-btn" onClick={() => setInactiveModal(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="alert alert-warning">
                停用后该座位将无法被预约，已有预约不受影响
              </div>
              <div className="form-group">
                <label>停用原因 *</label>
                <select
                  className="input"
                  value={inactiveForm.reason}
                  onChange={e => setInactiveForm({ ...inactiveForm, reason: e.target.value })}
                >
                  <option value={INACTIVE_REASON.CLEANING}>深度清洁</option>
                  <option value={INACTIVE_REASON.REPAIR}>维修</option>
                  <option value={INACTIVE_REASON.OTHER}>其他</option>
                </select>
              </div>
              <div className="form-group">
                <label>备注说明</label>
                <textarea
                  className="input"
                  rows="3"
                  value={inactiveForm.note}
                  onChange={e => setInactiveForm({ ...inactiveForm, note: e.target.value })}
                  placeholder="如：调色板损坏、水管维修等..."
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setInactiveModal(null)}>
                  取消
                </button>
                <button type="button" className="btn btn-danger" onClick={handleSetInactive}>
                  确认停用
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
