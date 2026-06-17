import React, { useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { workService } from '../../services/business.js'
import { REVIEW_STATUS_TEXT } from '../../data/storage.js'

export default function WorkReview() {
  const { works, bookings, paints, seats, refreshWorks, refreshBookings, showNotification } = useApp()
  const [filter, setFilter] = useState('all')
  const [reviewingWork, setReviewingWork] = useState(null)
  const [reviewForm, setReviewForm] = useState({ teacherComment: '', score: null })

  const sortedWorks = [...works].sort((a, b) => {
    if (a.reviewStatus !== b.reviewStatus) {
      return a.reviewStatus === 'pending' ? -1 : 1
    }
    return new Date(b.submitTime) - new Date(a.submitTime)
  })

  const filteredWorks = sortedWorks.filter(w => {
    if (filter === 'pending') return w.reviewStatus === 'pending'
    if (filter === 'reviewed') return w.reviewStatus === 'reviewed'
    return true
  })

  const getBooking = (id) => bookings.find(b => b.id === id)
  const getPaint = (id) => paints.find(p => p.id === id)

  const handleOpenReview = (work) => {
    setReviewingWork(work)
    setReviewForm({
      teacherComment: work.teacherComment || '',
      score: work.score !== null ? work.score : null,
    })
  }

  const handleCloseReview = () => {
    setReviewingWork(null)
    setReviewForm({ teacherComment: '', score: null })
  }

  const handleReviewSubmit = (e) => {
    e.preventDefault()
    try {
      workService.reviewWork(reviewingWork.id, reviewForm)
      refreshWorks()
      showNotification('作品评审完成', 'success')
      handleCloseReview()
    } catch (err) {
      showNotification(err.message, 'error')
    }
  }

  const avgScore = works.filter(w => w.score !== null).length > 0
    ? (works.filter(w => w.score !== null).reduce((s, w) => s + w.score, 0) /
       works.filter(w => w.score !== null).length).toFixed(1)
    : '-'

  return (
    <div className="module-container">
      <div className="module-header">
        <h2 className="module-title">作品评审</h2>
        <div className="filter-tabs">
          <button
            className={`tab-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            全部 <span className="tab-count">{works.length}</span>
          </button>
          <button
            className={`tab-btn ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            待评审 <span className="tab-count">{works.filter(w => w.reviewStatus === 'pending').length}</span>
          </button>
          <button
            className={`tab-btn ${filter === 'reviewed' ? 'active' : ''}`}
            onClick={() => setFilter('reviewed')}
          >
            已评审 <span className="tab-count">{works.filter(w => w.reviewStatus === 'reviewed').length}</span>
          </button>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-card stat-blue">
          <div className="stat-number">{works.length}</div>
          <div className="stat-label">作品总数</div>
        </div>
        <div className="stat-card stat-orange">
          <div className="stat-number">{works.filter(w => w.reviewStatus === 'pending').length}</div>
          <div className="stat-label">待评审</div>
        </div>
        <div className="stat-card stat-green">
          <div className="stat-number">{works.filter(w => w.reviewStatus === 'reviewed').length}</div>
          <div className="stat-label">已评审</div>
        </div>
        <div className="stat-card stat-purple">
          <div className="stat-number">{avgScore}</div>
          <div className="stat-label">平均分</div>
        </div>
      </div>

      {filteredWorks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>暂无作品数据</h3>
          <p className="muted-text">等待学员提交作品...</p>
        </div>
      ) : (
        <div className="works-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>作品</th>
                <th>学员</th>
                <th>课程信息</th>
                <th>提交时间</th>
                <th>状态</th>
                <th>评分</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredWorks.map(work => {
                const booking = getBooking(work.bookingId)
                const workPaints = booking ? booking.paintIds.map(id => getPaint(id)).filter(Boolean) : []

                return (
                  <tr key={work.id} className={`work-row status-${work.reviewStatus}`}>
                    <td>
                      <div className="work-cell">
                        <div className="work-thumb">
                          <span className="work-icon-sm">🖼️</span>
                        </div>
                        <div>
                          <div className="font-medium">{work.title}</div>
                          <div className="muted-text-sm">ID: {work.id}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="font-medium">{work.studentName}</div>
                      <div className="muted-text-sm">{work.studentId}</div>
                    </td>
                    <td>
                      {booking ? (
                        <>
                          <div>{booking.course}</div>
                          <div className="muted-text-sm">{booking.date} {booking.timeSlot}</div>
                          {workPaints.length > 0 && (
                            <div className="paint-tags paint-tags-sm">
                              {workPaints.slice(0, 3).map(paint => (
                                <span key={paint.id} className="paint-tag paint-tag-xs">
                                  <span
                                    className="paint-tag-color"
                                    style={{ backgroundColor: paint.color, border: '1px solid #ddd' }}
                                  />
                                </span>
                              ))}
                              {workPaints.length > 3 && (
                                <span className="muted-text-sm">+{workPaints.length - 3}</span>
                              )}
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="muted-text">预约已删除</span>
                      )}
                    </td>
                    <td>
                      {new Date(work.submitTime).toLocaleString('zh-CN')}
                    </td>
                    <td>
                      <span className={`tag tag-${work.reviewStatus}`}>
                        {REVIEW_STATUS_TEXT[work.reviewStatus]}
                      </span>
                    </td>
                    <td>
                      {work.score !== null ? (
                        <span className="work-score-badge">{work.score}分</span>
                      ) : (
                        <span className="muted-text">-</span>
                      )}
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => handleOpenReview(work)}
                      >
                        {work.reviewStatus === 'reviewed' ? '查看/修改' : '评审'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {reviewingWork && (
        <div className="modal-overlay" onClick={handleCloseReview}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {reviewingWork.reviewStatus === 'reviewed' ? '查看/修改评审' : '作品评审'}
              </h3>
              <button className="close-btn" onClick={handleCloseReview}>×</button>
            </div>
            <div className="modal-body">
              <div className="review-detail-card card">
                <div className="review-detail-header">
                  <div className="work-placeholder-large">
                    <div className="work-icon">🖼️</div>
                    <div className="muted-text-sm">（作品图片占位）</div>
                  </div>
                  <div className="review-info">
                    <h3 className="work-title-large">{reviewingWork.title}</h3>
                    <div className="review-meta-row">
                      <span>👤 {reviewingWork.studentName}（{reviewingWork.studentId}）</span>
                      <span className="muted-text">|</span>
                      <span>📅 {new Date(reviewingWork.submitTime).toLocaleString('zh-CN')}</span>
                    </div>
                    {(() => {
                      const b = getBooking(reviewingWork.bookingId)
                      if (!b) return null
                      const ps = b.paintIds.map(id => getPaint(id)).filter(Boolean)
                      const seat = seats.find(x => x.id === b.seatId)
                      const seatStr = seat ? `${seat.name}（${seat.location || ''}）` : b.seatId
                      return (
                        <>
                          <div className="review-meta-row">
                            <span>📚 {b.course}</span>
                            <span className="muted-text">|</span>
                            <span>💺 {seatStr}</span>
                          </div>
                          {ps.length > 0 && (
                            <div className="paint-tags">
                              {ps.map(paint => (
                                <span key={paint.id} className="paint-tag">
                                  <span
                                    className="paint-tag-color"
                                    style={{ backgroundColor: paint.color, border: '1px solid #ddd' }}
                                  />
                                  {paint.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </>
                      )
                    })()}
                  </div>
                </div>
                {reviewingWork.description && (
                  <div className="work-description-block">
                    <div className="section-label">作品描述</div>
                    <p>{reviewingWork.description}</p>
                  </div>
                )}
              </div>

              <form onSubmit={handleReviewSubmit} style={{ marginTop: '20px' }}>
                <div className="form-row">
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>评分（0-100）</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      className="input"
                      value={reviewForm.score === null ? '' : reviewForm.score}
                      onChange={e => setReviewForm({ ...reviewForm, score: e.target.value === '' ? null : Number(e.target.value) })}
                      placeholder="请输入分数"
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>快速打分</label>
                    <div className="quick-score-btns">
                      {[60, 70, 80, 90, 100].map(s => (
                        <button
                          key={s}
                          type="button"
                          className={`quick-score-btn ${reviewForm.score === s ? 'active' : ''}`}
                          onClick={() => setReviewForm({ ...reviewForm, score: s })}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="form-group">
                  <label>老师点评</label>
                  <textarea
                    className="input"
                    rows="4"
                    value={reviewForm.teacherComment}
                    onChange={e => setReviewForm({ ...reviewForm, teacherComment: e.target.value })}
                    placeholder="请输入对作品的点评意见..."
                  />
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={handleCloseReview}>
                    取消
                  </button>
                  <button type="submit" className="btn btn-primary">
                    提交评审
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
