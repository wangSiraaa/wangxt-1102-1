import React, { useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { REVIEW_STATUS_TEXT } from '../../data/storage.js'

export default function MyWorks() {
  const { works, bookings, currentStudent, paints, paintPackages } = useApp()
  const [filter, setFilter] = useState('all')

  const myWorks = works
    .filter(w => w.studentId === currentStudent.id)
    .sort((a, b) => new Date(b.submitTime) - new Date(a.submitTime))

  const filteredWorks = myWorks.filter(w => {
    if (filter === 'reviewed') return w.reviewStatus === 'reviewed'
    if (filter === 'pending') return w.reviewStatus === 'pending'
    if (filter === 'extraFee') {
      const b = getBooking(w.bookingId)
      return b && b.extraFeeRequired
    }
    return true
  })

  const getBooking = (id) => bookings.find(b => b.id === id)
  const getPaint = (id) => paints.find(p => p.id === id)
  const getPackage = (id) => paintPackages.find(p => p.id === id)

  return (
    <div className="module-container">
      <div className="module-header">
        <h2 className="module-title">我的作品</h2>
        <div className="filter-tabs">
          {[
            { key: 'all', label: '全部' },
            { key: 'pending', label: '待评审' },
            { key: 'reviewed', label: '已评审' },
            { key: 'extraFee', label: '待缴费' },
          ].map(tab => (
            <button
              key={tab.key}
              className={`tab-btn ${filter === tab.key ? 'active' : ''}`}
              onClick={() => setFilter(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {filteredWorks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🎨</div>
          <h3>还没有提交作品</h3>
          <p className="muted-text">完成课程后，在"我的预约"中提交你的作品吧！</p>
        </div>
      ) : (
        <div className="works-grid">
          {filteredWorks.map(work => {
            const booking = getBooking(work.bookingId)
            const workPaints = booking ? booking.paintIds.map(id => getPaint(id)).filter(Boolean) : []
            const pkg = booking && booking.paintPackageId ? getPackage(booking.paintPackageId) : null

            return (
              <div key={work.id} className="card work-card">
                <div className="work-card-placeholder">
                  <div className="work-icon">🖼️</div>
                  <div className="muted-text-sm">（作品图片占位）</div>
                </div>
                <div className="card-body">
                  <h3 className="card-title">{work.title}</h3>
                  <div className="work-meta">
                    <span className="muted-text-sm">
                      📅 提交时间：{new Date(work.submitTime).toLocaleString('zh-CN')}
                    </span>
                  </div>
                  {booking && (
                    <div className="work-meta">
                      <span className="muted-text-sm">
                        📚 {booking.course} | {booking.date} {booking.timeSlot}
                      </span>
                    </div>
                  )}

                  {pkg && (
                    <div className="work-meta">
                      <span className="muted-text-sm">
                        📦 颜料套餐：{pkg.name}
                      </span>
                    </div>
                  )}

                  {workPaints.length > 0 && (
                    <div className="work-meta">
                      <div className="paint-tags">
                        {workPaints.map(paint => (
                          <span key={paint.id} className="paint-tag paint-tag-sm">
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

                  {booking && booking.paintUsage && booking.paintUsage.length > 0 && (
                    <div className="work-usage">
                      <div className="work-usage-title">
                        📦 材料耗用
                      </div>
                      <div className="usage-list">
                        {booking.paintUsage.map(u => {
                          const p = getPaint(u.paintId)
                          return p ? (
                            <div key={u.paintId} className="usage-item">
                              <span className="usage-name">{p.name}</span>
                              <span className="usage-amount">{u.amount}{p.unit}</span>
                            </div>
                          ) : null
                        })}
                      </div>
                    </div>
                  )}

                  {booking && booking.extraFeeRequired && (
                    <div className={`extra-fee-banner ${booking.extraFeePaid ? 'paid' : ''}`}>
                      {booking.extraFeePaid ? (
                        <span className="extra-fee-text">
                          ✅ 补缴费用已结清
                        </span>
                      ) : (
                        <span className="extra-fee-text">
                          ⚠ 需补缴耗材费：<strong>¥{booking.extraFeeAmount}</strong>
                        </span>
                      )}
                    </div>
                  )}

                  {work.description && (
                    <p className="work-description">{work.description}</p>
                  )}
                  <div className="work-review">
                    <div className="review-status">
                      <span className={`tag tag-${work.reviewStatus}`}>
                        {REVIEW_STATUS_TEXT[work.reviewStatus]}
                      </span>
                      {work.score !== null && (
                        <span className="work-score">得分：{work.score}分</span>
                      )}
                    </div>
                    {work.reviewStatus === 'reviewed' && work.teacherComment && (
                      <div className="teacher-comment">
                        <div className="teacher-comment-label">💬 老师点评</div>
                        <p>{work.teacherComment}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
