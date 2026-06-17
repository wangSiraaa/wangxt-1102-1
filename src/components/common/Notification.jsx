import React from 'react'
import { useApp } from '../../context/AppContext.jsx'

export default function Notification() {
  const { notification } = useApp()

  if (!notification) return null

  const typeStyles = {
    success: 'notification-success',
    error: 'notification-error',
    warning: 'notification-warning',
    info: 'notification-info',
  }

  const typeIcons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
  }

  return (
    <div className={`notification ${typeStyles[notification.type] || typeStyles.info}`}>
      <span className="notification-icon">
        <span className="notification-icon-inner">
          <span className="notification-msg">
            <span className="notif-icon">{typeIcons[notification.type] || 'ℹ️'}</span>
            <span className="notif-text">{notification.message}</span>
          </span>
        </span>
      </span>
    </div>
  )
}
