import React, { useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { seatService } from '../../services/business.js'
import { CLEAN_STATUS, CLEAN_STATUS_TEXT } from '../../data/storage.js'

export default function SeatManagement() {
  const { seats, refreshSeats, showNotification } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [editingSeat, setEditingSeat] = useState(null)
  const [formData, setFormData] = useState({ name: '', location: '' })

  const handleOpenForm = (seat = null) => {
    setEditingSeat(seat)
    setFormData(seat ? { name: seat.name, location: seat.location } : { name: '', location: '' })
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingSeat(null)
    setFormData({ name: '', location: '' })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      showNotification('请输入座位名称', 'error')
      return
    }
    try {
      if (editingSeat) {
        seatService.updateSeat(editingSeat.id, formData)
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

  const handleCleanStatus = (seatId, status) => {
    try {
      seatService.setCleanStatus(seatId, status)
      refreshSeats()
      showNotification('状态更新成功', 'success')
    } catch (err) {
      showNotification(err.message, 'error')
    }
  }

  const handleToggleActive = (seatId) => {
    try {
      seatService.toggleActive(seatId)
      refreshSeats()
      showNotification('状态更新成功', 'success')
    } catch (err) {
      showNotification(err.message, 'error')
    }
  }

  return (
    <div className="module-container">
      <div className="module-header">
        <h2 className="module-title">座位管理</h2>
        <button className="btn btn-primary" onClick={() => handleOpenForm()}>
          + 添加座位
        </button>
      </div>

      <div className="stats-row">
        <div className="stat-card stat-green">
          <div className="stat-number">{seats.filter(s => s.cleanStatus === CLEAN_STATUS.CLEANED).length}</div>
          <div className="stat-label">可用座位</div>
        </div>
        <div className="stat-card stat-yellow">
          <div className="stat-number">{seats.filter(s => s.cleanStatus === CLEAN_STATUS.CLEANING).length}</div>
          <div className="stat-label">清洁中</div>
        </div>
        <div className="stat-card stat-red">
          <div className="stat-number">{seats.filter(s => s.cleanStatus === CLEAN_STATUS.DIRTY).length}</div>
          <div className="stat-label">待清洁</div>
        </div>
        <div className="stat-card stat-gray">
          <div className="stat-number">{seats.filter(s => !s.isActive).length}</div>
          <div className="stat-label">已停用</div>
        </div>
      </div>

      <div className="card-grid">
        {seats.map(seat => (
          <div key={seat.id} className={`card seat-card ${seat.isActive ? '' : 'inactive'}`}>
            <div className="card-header">
              <h3 className="card-title">{seat.name}</h3>
              <span className={`tag tag-${seat.cleanStatus}`}>
                {CLEAN_STATUS_TEXT[seat.cleanStatus]}
              </span>
            </div>
            <div className="card-body">
              <p className="muted-text">位置：{seat.location || '未设置'}</p>
              <p className="muted-text">编号：{seat.id}</p>
              <div className="status-bar">
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={seat.isActive}
                    onChange={() => handleToggleActive(seat.id)}
                  />
                  <span className="slider"></span>
                </label>
                <span className="muted-text">{seat.isActive ? '启用中' : '已停用'}</span>
              </div>
            </div>
            <div className="card-footer">
              <div className="action-group">
                <select
                  className="input-sm"
                  value={seat.cleanStatus}
                  onChange={(e) => handleCleanStatus(seat.id, e.target.value)}
                >
                  <option value={CLEAN_STATUS.CLEANED}>已清洁</option>
                  <option value={CLEAN_STATUS.CLEANING}>清洁中</option>
                  <option value={CLEAN_STATUS.DIRTY}>待清洁</option>
                </select>
              </div>
              <div className="action-group">
                <button className="btn btn-sm btn-secondary" onClick={() => handleOpenForm(seat)}>
                  编辑
                </button>
                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(seat.id)}>
                  删除
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

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
                  placeholder="如：1号座位"
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
    </div>
  )
}
