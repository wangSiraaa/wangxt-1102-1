import React, { useState } from 'react'
import { AppProvider, useApp } from './context/AppContext.jsx'
import SeatManagement from './components/admin/SeatManagement.jsx'
import PaintManagement from './components/admin/PaintManagement.jsx'
import CreateBooking from './components/student/CreateBooking.jsx'
import MyBookings from './components/student/MyBookings.jsx'
import MyWorks from './components/student/MyWorks.jsx'
import WorkReview from './components/teacher/WorkReview.jsx'
import Notification from './components/common/Notification.jsx'
import { storage } from './data/storage.js'

const ROLE_CONFIG = {
  admin: {
    name: '画室管理员',
    icon: '🛠️',
    menus: [
      { key: 'dashboard', label: '概览', icon: '📊' },
      { key: 'seats', label: '座位管理', icon: '💺' },
      { key: 'paints', label: '颜料库存', icon: '🎨' },
    ],
  },
  student: {
    name: '学员',
    icon: '🎓',
    menus: [
      { key: 'dashboard', label: '概览', icon: '📊' },
      { key: 'create', label: '创建预约', icon: '📅' },
      { key: 'bookings', label: '我的预约', icon: '📋' },
      { key: 'works', label: '我的作品', icon: '🖼️' },
    ],
  },
  teacher: {
    name: '老师',
    icon: '👨‍🏫',
    menus: [
      { key: 'dashboard', label: '概览', icon: '📊' },
      { key: 'review', label: '作品评审', icon: '✍️' },
    ],
  },
}

const STUDENTS = [
  { id: 'STU001', name: '张小明' },
  { id: 'STU002', name: '李小红' },
  { id: 'STU003', name: '王小芳' },
  { id: 'STU004', name: '赵小强' },
  { id: 'STU005', name: '刘小燕' },
]

function RoleSelector() {
  const { currentRole, setCurrentRole } = useApp()

  return (
    <div className="role-selector">
      {Object.entries(ROLE_CONFIG).map(([key, cfg]) => (
        <button
          key={key}
          className={`role-btn ${currentRole === key ? 'active' : ''}`}
          onClick={() => setCurrentRole(key)}
        >
          <span className="role-icon">{cfg.icon}</span>
          <span className="role-name">{cfg.name}</span>
        </button>
      ))}
    </div>
  )
}

function StudentSelector() {
  const { currentStudent, setCurrentStudent } = useApp()

  return (
    <div className="student-selector">
      <span className="muted-text-sm">切换学员身份：</span>
      <select
        className="input input-sm"
        value={currentStudent.id}
        onChange={e => {
          const s = STUDENTS.find(x => x.id === e.target.value)
          if (s) setCurrentStudent(s)
        }}
      >
        {STUDENTS.map(s => (
          <option key={s.id} value={s.id}>{s.name}（{s.id}）</option>
        ))}
      </select>
    </div>
  )
}

function Sidebar({ activeMenu, setActiveMenu }) {
  const { currentRole } = useApp()
  const config = ROLE_CONFIG[currentRole]

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-icon">🎨</div>
        <div className="brand">
          <div className="brand-name">共享画室</div>
          <div className="brand-sub">Studio Booking</div>
        </div>
      </div>

      <div className="sidebar-user">
        <div className="user-avatar">{config.icon}</div>
        <div>
          <div className="user-name">{config.name}</div>
          <div className="user-role">当前身份</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {config.menus.map(menu => (
          <button
            key={menu.key}
            className={`nav-item ${activeMenu === menu.key ? 'active' : ''}`}
            onClick={() => setActiveMenu(menu.key)}
          >
            <span className="nav-icon">{menu.icon}</span>
            <span className="nav-label">{menu.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button
          className="btn btn-outline btn-block"
          onClick={() => {
            if (confirm('确定要重置所有数据到初始状态吗？此操作不可恢复。')) {
              storage.resetAll()
              window.location.reload()
            }
          }}
        >
          🔄 重置演示数据
        </button>
      </div>
    </aside>
  )
}

function Header({ activeMenu }) {
  const { currentRole, currentStudent, refreshAll, showNotification } = useApp()
  const config = ROLE_CONFIG[currentRole]
  const menuConfig = config.menus.find(m => m.key === activeMenu)

  const handleRefresh = () => {
    refreshAll()
    showNotification('数据已刷新', 'success')
  }

  return (
    <header className="header">
      <div className="header-left">
        <h1 className="page-title">
          {menuConfig?.icon} {menuConfig?.label || '概览'}
        </h1>
      </div>
      <div className="header-right">
        <RoleSelector />
        {currentRole === 'student' && <StudentSelector />}
        <button className="btn btn-secondary btn-sm" onClick={handleRefresh}>
          🔃 刷新
        </button>
      </div>
    </header>
  )
}

function AdminDashboard() {
  const { seats, paints, bookings, works } = useApp()

  const today = new Date().toISOString().split('T')[0]
  const todayBookings = bookings.filter(b => b.date === today && b.status === 'booked')
  const lowStockPaints = paints.filter(p => p.stock <= p.threshold)
  const dirtySeats = seats.filter(s => s.cleanStatus !== 'cleaned')

  return (
    <div className="module-container">
      <div className="module-header">
        <h2 className="module-title">管理员概览</h2>
      </div>

      <div className="stats-row">
        <div className="stat-card stat-blue">
          <div className="stat-number">{seats.length}</div>
          <div className="stat-label">座位总数</div>
        </div>
        <div className="stat-card stat-green">
          <div className="stat-number">{seats.filter(s => s.cleanStatus === 'cleaned' && s.isActive).length}</div>
          <div className="stat-label">可用座位</div>
        </div>
        <div className="stat-card stat-purple">
          <div className="stat-number">{paints.length}</div>
          <div className="stat-label">颜料种类</div>
        </div>
        <div className="stat-card stat-orange">
          <div className="stat-number">{todayBookings.length}</div>
          <div className="stat-label">今日预约</div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card dashboard-card">
          <div className="card-header">
            <h3 className="card-title">⚠️ 需处理事项</h3>
          </div>
          <div className="card-body">
            {dirtySeats.length > 0 ? (
              <div className="todo-item todo-warning">
                <span>💺 {dirtySeats.length} 个座位待清洁</span>
                <div className="todo-sublist">
                  {dirtySeats.slice(0, 5).map(s => (
                    <span key={s.id} className="todo-subitem">{s.name}</span>
                  ))}
                  {dirtySeats.length > 5 && <span className="muted-text-sm">...还有 {dirtySeats.length - 5} 个</span>}
                </div>
              </div>
            ) : (
              <div className="todo-item todo-success">
                <span>✅ 所有座位均已清洁</span>
              </div>
            )}
            {lowStockPaints.length > 0 ? (
              <div className="todo-item todo-danger">
                <span>🎨 {lowStockPaints.length} 种颜料库存不足</span>
                <div className="todo-sublist">
                  {lowStockPaints.slice(0, 5).map(p => (
                    <span key={p.id} className="todo-subitem">
                      {p.name}（剩{p.stock}{p.unit}）
                    </span>
                  ))}
                  {lowStockPaints.length > 5 && <span className="muted-text-sm">...还有 {lowStockPaints.length - 5} 种</span>}
                </div>
              </div>
            ) : (
              <div className="todo-item todo-success">
                <span>✅ 所有颜料库存充足</span>
              </div>
            )}
            <div className="todo-item todo-info">
              <span>📋 {works.filter(w => w.reviewStatus === 'pending').length} 件作品待评审</span>
            </div>
          </div>
        </div>

        <div className="card dashboard-card">
          <div className="card-header">
            <h3 className="card-title">📅 今日预约（{todayBookings.length}）</h3>
          </div>
          <div className="card-body">
            {todayBookings.length === 0 ? (
              <div className="muted-text">今日暂无预约</div>
            ) : (
              <div className="booking-schedule">
                {todayBookings
                  .sort((a, b) => a.timeSlot.localeCompare(b.timeSlot))
                  .map(b => {
                    const seat = seats.find(s => s.id === b.seatId)
                    return (
                      <div key={b.id} className="schedule-item">
                        <div className="schedule-time">{b.timeSlot}</div>
                        <div className="schedule-info">
                          <div className="font-medium">{b.studentName} · {b.course}</div>
                          <div className="muted-text-sm">
                            {seat ? seat.name : '座位已删除'} · {b.paintIds.length} 种颜料
                          </div>
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StudentDashboard() {
  const { bookings, works, currentStudent, seats, paints } = useApp()

  const myBookings = bookings.filter(b => b.studentId === currentStudent.id)
  const activeBookings = myBookings.filter(b => b.status === 'booked')
  const myWorks = works.filter(w => w.studentId === currentStudent.id)
  const pendingWorks = myBookings.filter(b => b.status === 'completed' && !b.workSubmitted)

  return (
    <div className="module-container">
      <div className="module-header">
        <h2 className="module-title">欢迎回来，{currentStudent.name}！</h2>
      </div>

      <div className="stats-row">
        <div className="stat-card stat-blue">
          <div className="stat-number">{activeBookings.length}</div>
          <div className="stat-label">进行中的预约</div>
        </div>
        <div className="stat-card stat-orange">
          <div className="stat-number">{pendingWorks.length}</div>
          <div className="stat-label">待提交作品</div>
        </div>
        <div className="stat-card stat-green">
          <div className="stat-number">{myWorks.length}</div>
          <div className="stat-label">已提交作品</div>
        </div>
        <div className="stat-card stat-purple">
          <div className="stat-number">
            {myWorks.filter(w => w.score !== null).length > 0
              ? (myWorks.filter(w => w.score !== null).reduce((s, w) => s + w.score, 0) /
                 myWorks.filter(w => w.score !== null).length).toFixed(0)
              : '-'}
          </div>
          <div className="stat-label">作品平均分</div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card dashboard-card">
          <div className="card-header">
            <h3 className="card-title">📅 即将到来的预约</h3>
          </div>
          <div className="card-body">
            {activeBookings.length === 0 ? (
              <div className="empty-hint">暂无进行中的预约，快去创建一个吧！</div>
            ) : (
              <div className="booking-schedule">
                {activeBookings
                  .sort((a, b) => (a.date + a.timeSlot).localeCompare(b.date + b.timeSlot))
                  .slice(0, 5)
                  .map(b => {
                    const seat = seats.find(s => s.id === b.seatId)
                    return (
                      <div key={b.id} className="schedule-item">
                        <div className="schedule-date">
                          <div className="schedule-date-day">{b.date.slice(5)}</div>
                          <div className="schedule-date-time">{b.timeSlot}</div>
                        </div>
                        <div className="schedule-info">
                          <div className="font-medium">{b.course}</div>
                          <div className="muted-text-sm">
                            {seat ? seat.name : '座位已删除'}
                          </div>
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}
          </div>
        </div>

        <div className="card dashboard-card">
          <div className="card-header">
            <h3 className="card-title">📋 待办事项</h3>
          </div>
          <div className="card-body">
            {pendingWorks.length > 0 && (
              <div className="todo-item todo-warning">
                <span>🖼️ 有 {pendingWorks.length} 个课程的作品待提交</span>
                <div className="todo-sublist">
                  {pendingWorks.map(b => (
                    <span key={b.id} className="todo-subitem">
                      {b.course}（{b.date}）
                    </span>
                  ))}
                </div>
              </div>
            )}
            {myWorks.filter(w => w.reviewStatus === 'pending').length > 0 && (
              <div className="todo-item todo-info">
                <span>⏳ {myWorks.filter(w => w.reviewStatus === 'pending').length} 件作品等待老师评审</span>
              </div>
            )}
            {myWorks.filter(w => w.reviewStatus === 'reviewed').length > 0 && (
              <div className="todo-item todo-success">
                <span>✅ {myWorks.filter(w => w.reviewStatus === 'reviewed').length} 件作品已获得老师点评</span>
              </div>
            )}
            {pendingWorks.length === 0 &&
             myWorks.filter(w => w.reviewStatus === 'pending').length === 0 && (
              <div className="muted-text">暂时没有待办事项 🎉</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function TeacherDashboard() {
  const { works, bookings, seats, paints } = useApp()

  const pendingReview = works.filter(w => w.reviewStatus === 'pending')
  const reviewed = works.filter(w => w.reviewStatus === 'reviewed')
  const avgScore = reviewed.length > 0
    ? (reviewed.reduce((s, w) => s + w.score, 0) / reviewed.length).toFixed(1)
    : '-'

  const today = new Date().toISOString().split('T')[0]
  const todayBookings = bookings.filter(b => b.date === today && b.status === 'booked')

  return (
    <div className="module-container">
      <div className="module-header">
        <h2 className="module-title">老师工作概览</h2>
      </div>

      <div className="stats-row">
        <div className="stat-card stat-blue">
          <div className="stat-number">{works.length}</div>
          <div className="stat-label">作品总数</div>
        </div>
        <div className="stat-card stat-orange">
          <div className="stat-number">{pendingReview.length}</div>
          <div className="stat-label">待评审</div>
        </div>
        <div className="stat-card stat-green">
          <div className="stat-number">{reviewed.length}</div>
          <div className="stat-label">已评审</div>
        </div>
        <div className="stat-card stat-purple">
          <div className="stat-number">{avgScore}</div>
          <div className="stat-label">平均评分</div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card dashboard-card">
          <div className="card-header">
            <h3 className="card-title">⏳ 待评审作品（{pendingReview.length}）</h3>
          </div>
          <div className="card-body">
            {pendingReview.length === 0 ? (
              <div className="todo-item todo-success">
                <span>🎉 所有作品均已评审完成！</span>
              </div>
            ) : (
              <div className="review-list">
                {pendingReview.slice(0, 6).map(w => (
                  <div key={w.id} className="review-list-item">
                    <div className="review-list-thumb">🖼️</div>
                    <div className="review-list-info">
                      <div className="font-medium">{w.title}</div>
                      <div className="muted-text-sm">
                        {w.studentName} · {new Date(w.submitTime).toLocaleDateString('zh-CN')}
                      </div>
                    </div>
                  </div>
                ))}
                {pendingReview.length > 6 && (
                  <div className="muted-text-sm">还有 {pendingReview.length - 6} 件待评审...</div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="card dashboard-card">
          <div className="card-header">
            <h3 className="card-title">📅 今日课程（{todayBookings.length}）</h3>
          </div>
          <div className="card-body">
            {todayBookings.length === 0 ? (
              <div className="muted-text">今日暂无学员上课</div>
            ) : (
              <div className="booking-schedule">
                {todayBookings
                  .sort((a, b) => a.timeSlot.localeCompare(b.timeSlot))
                  .map(b => {
                    const seat = seats.find(s => s.id === b.seatId)
                    const ps = b.paintIds.map(id => paints.find(p => p.id === id)).filter(Boolean)
                    return (
                      <div key={b.id} className="schedule-item">
                        <div className="schedule-time">{b.timeSlot}</div>
                        <div className="schedule-info">
                          <div className="font-medium">{b.studentName} · {b.course}</div>
                          <div className="muted-text-sm">
                            {seat ? seat.name : '座位异常'} · 颜料{ps.length}种
                          </div>
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Dashboard() {
  const { currentRole } = useApp()
  if (currentRole === 'admin') return <AdminDashboard />
  if (currentRole === 'student') return <StudentDashboard />
  return <TeacherDashboard />
}

function MainContent({ activeMenu }) {
  const { currentRole } = useApp()

  const renderContent = () => {
    if (activeMenu === 'dashboard') return <Dashboard />

    if (currentRole === 'admin') {
      switch (activeMenu) {
        case 'seats': return <SeatManagement />
        case 'paints': return <PaintManagement />
        default: return <Dashboard />
      }
    }

    if (currentRole === 'student') {
      switch (activeMenu) {
        case 'create': return <CreateBooking />
        case 'bookings': return <MyBookings />
        case 'works': return <MyWorks />
        default: return <Dashboard />
      }
    }

    if (currentRole === 'teacher') {
      switch (activeMenu) {
        case 'review': return <WorkReview />
        default: return <Dashboard />
      }
    }

    return <Dashboard />
  }

  return <main className="main-content">{renderContent()}</main>
}

function AppShell() {
  const { currentRole } = useApp()
  const [activeMenu, setActiveMenu] = useState('dashboard')

  const handleRoleChange = (prev, next) => {
    if (prev !== next) {
      setActiveMenu('dashboard')
    }
  }

  React.useEffect(() => {
    const prev = { current: currentRole }
    return () => {
      handleRoleChange(prev.current, currentRole)
    }
  }, [currentRole])

  return (
    <div className="app-layout">
      <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} />
      <div className="app-main">
        <Header activeMenu={activeMenu} />
        <MainContent activeMenu={activeMenu} />
      </div>
      <Notification />
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  )
}
