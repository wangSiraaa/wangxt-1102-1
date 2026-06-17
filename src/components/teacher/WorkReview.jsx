import React, { useState, useMemo } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { workService, bookingService, paintService } from '../../services/business.js'
import { REVIEW_STATUS_TEXT, INACTIVE_REASON_TEXT } from '../../data/storage.js'

export default function WorkReview() {
  const { works, bookings, paints, seats, refreshWorks, refreshBookings, refreshPaints, showNotification } = useApp()
  const [filter, setFilter] = useState('all')
  const [reviewingWork, setReviewingWork] = useState(null)
  const [reviewForm, setReviewForm] = useState({
    teacherComment: '',
    score: null,
    paintUsage: [],
    extraFeeRequired: false,
    extraFeeAmount: 0,
    extraFeeNote: '',
  })

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
    const booking = getBooking(work.bookingId)
    const paintIds = booking ? booking.paintIds : []
    const existingUsage = booking && booking.paintUsage ? booking.paintUsage : []

    const paintUsage = paintIds.map(pid => {
      const existing = existingUsage.find(u => u.paintId === pid)
      return {
        paintId: pid,
        amount: existing ? existing.amount : 0,
      }
    })

    setReviewingWork(work)
    setReviewForm({
      teacherComment: work.teacherComment || '',
      score: work.score !== null ? work.score : null,
      paintUsage,
      extraFeeRequired: booking ? booking.extraFeeRequired || false : false,
      extraFeeAmount: booking ? booking.extraFeeAmount || 0 : 0,
      extraFeeNote: booking ? booking.extraFeeNote || '' : '',
    })
  }

  const handleCloseReview = () => {
    setReviewingWork(null)
    setReviewForm({
      teacherComment: '',
      score: null,
      paintUsage: [],
      extraFeeRequired: false,
      extraFeeAmount: 0,
      extraFeeNote: '',
    })
  }

  const handleUsageChange = (paintId, value) => {
    const amount = Math.max(0, Number(value) || 0)
    setReviewForm(prev => {
      const newUsage = prev.paintUsage.map(u =>
        u.paintId === paintId ? { ...u, amount } : u
      )
      return { ...prev, paintUsage: newUsage }
    })
  }

  const calculatedFee = useMemo(() => {
    return bookingService.calculateExtraFee(reviewForm.paintUsage.filter(u => u.amount > 0))
  }, [reviewForm.paintUsage])

  const handleReviewSubmit = (e) => {
    e.preventDefault()
    try {
      const validUsage = reviewForm.paintUsage.filter(u => u.amount > 0)

      const stockIssues = paintService.validatePaintUsage(validUsage)
      if (stockIssues.length > 0) {
        const errorMsg = stockIssues.map(issue => `• ${issue.reason}`).join('\n')
        showNotification(`颜料库存不足，无法提交：\n${errorMsg}`, 'error')
        return
      }

      paintService.batchUpdateStock(validUsage, 'consume')

      workService.reviewWork(reviewingWork.id, {
        teacherComment: reviewForm.teacherComment,
        score: reviewForm.score,
        paintUsage: validUsage,
        extraFeeRequired: reviewForm.extraFeeRequired,
        extraFeeAmount: reviewForm.extraFeeRequired ? reviewForm.extraFeeAmount : 0,
        extraFeeNote: reviewForm.extraFeeRequired ? reviewForm.extraFeeNote : '',
      })

      const verifyResult = paintService.verifyStockAfterReview(reviewingWork.bookingId, validUsage)
      if (!verifyResult.valid) {
        console.warn('评审后数据一致性校验警告:', verifyResult.issues)
      }

      refreshWorks()
      refreshBookings()
      refreshPaints()

      let successMsg = '作品评审完成，材料耗用已记录'
      if (validUsage.length > 0) {
        const paintNames = validUsage.map(u => {
          const p = getPaint(u.paintId)
          return p ? `${p.name}×${u.amount}${p.unit}` : u.paintId
        }).join('、')
        successMsg += `\n已扣减库存：${paintNames}`
      }
      showNotification(successMsg, 'success')
      handleCloseReview()
    } catch (err) {
      showNotification(err.message, 'error')
    }
  }

  const avgScore = works.filter(w => w.score !== null).length > 0
    ? (works.filter(w => w.score !== null).reduce((s, w) => s + w.score, 0) /
       works.filter(w => w.score !== null).length).toFixed(1)
    : '-'

  const pendingExtraFeeCount = bookings.filter(b => b.extraFeeRequired && b.status === 'completed').length

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
        <div className="stat-card stat-red">
          <div className="stat-number">{pendingExtraFeeCount}</div>
          <div className="stat-label">待补缴费用</div>
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
                <th>材料耗用</th>
                <th>费用</th>
                <th>状态</th>
                <th>评分</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredWorks.map(work => {
                const booking = getBooking(work.bookingId)
                const workPaints = booking ? booking.paintIds.map(id => getPaint(id)).filter(Boolean) : []
                const hasExtraFee = booking && booking.extraFeeRequired

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
                      <div>{new Date(work.submitTime).toLocaleDateString('zh-CN')}</div>
                      <div className="muted-text-sm">{new Date(work.submitTime).toLocaleTimeString('zh-CN')}</div>
                    </td>
                    <td>
                      {booking && booking.paintUsage && booking.paintUsage.length > 0 ? (
                        <div>
                          {booking.paintUsage.slice(0, 2).map(u => {
                            const p = getPaint(u.paintId)
                            return p ? (
                              <div key={u.paintId} className="muted-text-sm">
                                {p.name} × {u.amount}{p.unit}
                              </div>
                            ) : null
                          })}
                          {booking.paintUsage.length > 2 && (
                            <div className="muted-text-sm">+{booking.paintUsage.length - 2}项</div>
                          )}
                        </div>
                      ) : (
                        <span className="muted-text">未记录</span>
                      )}
                    </td>
                    <td>
                      {hasExtraFee ? (
                        <span className="tag tag-danger">¥{booking.extraFeeAmount}</span>
                      ) : (
                        <span className="muted-text">-</span>
                      )}
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
                          <div className="review-meta-row">
                            <span>⏰ 预约时间：{b.date} {b.timeSlot}</span>
                          </div>
                          {b.workSubmitted && (
                            <div className="alert alert-info" style={{ marginTop: '8px', padding: '8px 12px' }}>
                              🔒 作品已提交，预约信息已锁定，如需调整时间请取消后重新预约
                            </div>
                          )}
                          {ps.length > 0 && (
                            <div className="paint-tags" style={{ marginTop: '8px' }}>
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
                <div className="section-label">📦 材料耗用登记</div>
                <div className="card" style={{ marginBottom: '16px', padding: '12px' }}>
                  {reviewForm.paintUsage.length === 0 ? (
                    <div className="muted-text">本次预约未选择颜料</div>
                  ) : (
                    <div className="usage-table">
                      {reviewForm.paintUsage.map(usage => {
                        const paint = getPaint(usage.paintId)
                        if (!paint) return null
                        const stockCheck = paintService.checkStockSufficient(usage.paintId, usage.amount)
                        const isOverStock = usage.amount > 0 && !stockCheck.sufficient
                        return (
                          <div key={usage.paintId} className={`usage-row ${isOverStock ? 'usage-row-error' : ''}`}>
                            <div className="usage-paint-info">
                              <span
                                className="color-swatch"
                                style={{ backgroundColor: paint.color, border: '1px solid #ddd' }}
                              />
                              <span className="font-medium">{paint.name}</span>
                              <span className={`muted-text-sm ${isOverStock ? 'text-danger' : ''}`}>
                                （库存：{paint.stock}{paint.unit}，¥{paint.price}/{paint.unit}）
                              </span>
                              {isOverStock && (
                                <span className="text-danger" style={{ marginLeft: '8px', fontSize: '12px', fontWeight: '500' }}>
                                  ⚠️ {stockCheck.reason}
                                </span>
                              )}
                            </div>
                            <div className="usage-input-group">
                              <input
                                type="number"
                                min="0"
                                step="0.5"
                                className={`input input-sm ${isOverStock ? 'input-error' : ''}`}
                                style={{ width: '100px' }}
                                value={usage.amount}
                                onChange={e => handleUsageChange(usage.paintId, e.target.value)}
                              />
                              <span className="muted-text-sm" style={{ marginLeft: '6px' }}>{paint.unit}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                  {reviewForm.paintUsage.length > 0 && (
                    <div className="usage-summary">
                      <span className="muted-text">材料费用估算：</span>
                      <span className="font-medium" style={{ color: calculatedFee > 0 ? '#e74c3c' : '#666' }}>
                        ¥{calculatedFee.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="section-label">💰 补缴耗材费</div>
                <div className="card" style={{ marginBottom: '16px', padding: '12px' }}>
                  <div className="form-row" style={{ alignItems: 'center' }}>
                    <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="checkbox"
                        checked={reviewForm.extraFeeRequired}
                        onChange={e => setReviewForm(prev => ({ ...prev, extraFeeRequired: e.target.checked }))}
                      />
                      <span>需要补缴耗材费</span>
                    </label>
                  </div>
                  {reviewForm.extraFeeRequired && (
                    <>
                      <div className="form-row" style={{ marginTop: '12px' }}>
                        <div className="form-group" style={{ flex: 1 }}>
                          <label>补缴金额（元）*</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            className="input"
                            value={reviewForm.extraFeeAmount}
                            onChange={e => setReviewForm(prev => ({ ...prev, extraFeeAmount: Number(e.target.value) || 0 }))}
                            placeholder="请输入金额"
                          />
                        </div>
                        <div className="form-group" style={{ flex: 2 }}>
                          <label>费用说明</label>
                          <input
                            type="text"
                            className="input"
                            value={reviewForm.extraFeeNote}
                            onChange={e => setReviewForm(prev => ({ ...prev, extraFeeNote: e.target.value }))}
                            placeholder="如：超出套餐用量、特殊耗材等"
                          />
                        </div>
                      </div>
                      {calculatedFee > 0 && reviewForm.extraFeeAmount === 0 && (
                        <div className="alert alert-warning" style={{ marginTop: '8px' }}>
                          💡 根据材料耗用估算费用为 ¥{calculatedFee.toFixed(2)}，可参考此金额设置补缴费用
                        </div>
                      )}
                    </>
                  )}
                </div>

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
