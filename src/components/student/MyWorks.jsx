import React from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { REVIEW_STATUS_TEXT } from '../../data/storage.js'

export default function MyWorks() {
  const { works, bookings, currentStudent, paints } = useApp()

  const myWorks = works
    .filter(w => w.studentId === currentStudent.id)
    .sort((a, b) => new Date(b.submitTime) - new Date(a.submitTime))

  const getBooking = (id) => bookings.find(b => b.id === id)

  const getPaint = (id) => paints.find(p => p.id === id)

  return (
    <div className="module-container">
      <div className="module-header">
        <h2 className="module-title">我的作品</h2>
        <span className="muted-text">共 {myWorks.length} 件作品</span>
      </div>

      {myWorks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🎨</div>
          <h3>还没有提交作品</h3>
          <p className="muted-text">完成课程后，在"我的预约"中提交你的作品吧！</p>
        </div>
      ) : (
        <div className="works-grid">
          {myWorks.map(work => {
            const booking = getBooking(work.bookingId)
            const workPaints = booking ? booking.paintIds.map(id => getPaint(id)).filter(Boolean) : []

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
                      📅 {new Date(work.submitTime).toLocaleString('zh-CN')}
                    </span>
                  </div>
                  {booking && (
                    <div className="work-meta">
                      <span className="muted-text-sm">
                        📚 {booking.course} | {booking.date} {booking.timeSlot}
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
