import React, { useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { paintService } from '../../services/business.js'

export default function PaintManagement() {
  const { paints, refreshPaints, showNotification } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [editingPaint, setEditingPaint] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    color: '#CCCCCC',
    stock: 0,
    unit: '管',
    threshold: 10,
    price: 0,
  })
  const [filter, setFilter] = useState('all')

  const lowStockPaints = paints.filter(p => p.stock <= p.threshold)

  const handleOpenForm = (paint = null) => {
    setEditingPaint(paint)
    setFormData(paint ? { ...paint } : {
      name: '',
      color: '#CCCCCC',
      stock: 0,
      unit: '管',
      threshold: 10,
      price: 0,
    })
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingPaint(null)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      showNotification('请输入颜料名称', 'error')
      return
    }
    try {
      const data = {
        ...formData,
        stock: Number(formData.stock),
        threshold: Number(formData.threshold),
        price: Number(formData.price),
      }
      if (editingPaint) {
        paintService.updatePaint(editingPaint.id, data)
        showNotification('颜料更新成功', 'success')
      } else {
        paintService.addPaint(data)
        showNotification('颜料添加成功', 'success')
      }
      refreshPaints()
      handleCloseForm()
    } catch (err) {
      showNotification(err.message, 'error')
    }
  }

  const handleDelete = (paintId) => {
    if (!confirm('确定要删除该颜料吗？')) return
    try {
      paintService.deletePaint(paintId)
      refreshPaints()
      showNotification('颜料删除成功', 'success')
    } catch (err) {
      showNotification(err.message, 'error')
    }
  }

  const handleAdjustStock = (paintId, delta) => {
    try {
      paintService.updateStock(paintId, delta)
      refreshPaints()
      showNotification('库存调整成功', 'success')
    } catch (err) {
      showNotification(err.message, 'error')
    }
  }

  const filteredPaints = paints.filter(p => {
    if (filter === 'low') return p.stock <= p.threshold
    if (filter === 'out') return p.stock <= 0
    return true
  })

  return (
    <div className="module-container">
      <div className="module-header">
        <h2 className="module-title">颜料库存管理</h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          <select
            className="input"
            value={filter}
            onChange={e => setFilter(e.target.value)}
            style={{ width: '150px' }}
          >
            <option value="all">全部颜料</option>
            <option value="low">库存不足</option>
            <option value="out">缺货</option>
          </select>
          <button className="btn btn-primary" onClick={() => handleOpenForm()}>
            + 添加颜料
          </button>
        </div>
      </div>

      {lowStockPaints.length > 0 && (
        <div className="alert alert-warning">
          <strong>⚠ 库存预警：</strong>以下颜料库存不足或缺货：
          {lowStockPaints.map((p, i) => (
            <span key={p.id} className="alert-tag">
              {p.name}（剩{p.stock}{p.unit}）{i < lowStockPaints.length - 1 ? '、' : ''}
            </span>
          ))}
        </div>
      )}

      <div className="stats-row">
        <div className="stat-card stat-blue">
          <div className="stat-number">{paints.length}</div>
          <div className="stat-label">颜料种类</div>
        </div>
        <div className="stat-card stat-orange">
          <div className="stat-number">{lowStockPaints.length}</div>
          <div className="stat-label">库存不足</div>
        </div>
        <div className="stat-card stat-red">
          <div className="stat-number">{paints.filter(p => p.stock <= 0).length}</div>
          <div className="stat-label">缺货</div>
        </div>
        <div className="stat-card stat-green">
          <div className="stat-number">
            {paints.reduce((sum, p) => sum + p.stock * p.price, 0).toFixed(0)}
          </div>
          <div className="stat-label">库存总值（元）</div>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>色卡</th>
              <th>名称</th>
              <th>库存</th>
              <th>单位</th>
              <th>阈值</th>
              <th>单价</th>
              <th>状态</th>
              <th>调整库存</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredPaints.map(paint => (
              <tr key={paint.id}>
                <td>
                  <div
                    className="color-swatch"
                    style={{ backgroundColor: paint.color, border: '1px solid #ddd' }}
                    title={paint.color}
                  />
                </td>
                <td className="font-medium">{paint.name}</td>
                <td>{paint.stock}</td>
                <td>{paint.unit}</td>
                <td>{paint.threshold}</td>
                <td>¥{paint.price}</td>
                <td>
                  {paint.stock <= 0 ? (
                    <span className="tag tag-danger">缺货</span>
                  ) : paint.stock <= paint.threshold ? (
                    <span className="tag tag-warning">库存不足</span>
                  ) : (
                    <span className="tag tag-success">充足</span>
                  )}
                </td>
                <td>
                  <div className="stock-controls">
                    <button
                      className="btn btn-xs btn-secondary"
                      onClick={() => handleAdjustStock(paint.id, -1)}
                    >
                      -
                    </button>
                    <button
                      className="btn btn-xs btn-secondary"
                      onClick={() => handleAdjustStock(paint.id, 1)}
                    >
                      +
                    </button>
                    <button
                      className="btn btn-xs btn-primary"
                      onClick={() => handleAdjustStock(paint.id, 10)}
                    >
                      +10
                    </button>
                  </div>
                </td>
                <td>
                  <div className="action-group">
                    <button className="btn btn-sm btn-secondary" onClick={() => handleOpenForm(paint)}>
                      编辑
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(paint.id)}>
                      删除
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={handleCloseForm}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingPaint ? '编辑颜料' : '添加颜料'}</h3>
              <button className="close-btn" onClick={handleCloseForm}>×</button>
            </div>
            <form className="modal-body" onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>颜料名称 *</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="如：钛白"
                  />
                </div>
                <div className="form-group">
                  <label>颜色</label>
                  <input
                    type="color"
                    className="input color-input"
                    value={formData.color}
                    onChange={e => setFormData({ ...formData, color: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>库存数量</label>
                  <input
                    type="number"
                    min="0"
                    className="input"
                    value={formData.stock}
                    onChange={e => setFormData({ ...formData, stock: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>单位</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.unit}
                    onChange={e => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="管/瓶/盒"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>预警阈值</label>
                  <input
                    type="number"
                    min="0"
                    className="input"
                    value={formData.threshold}
                    onChange={e => setFormData({ ...formData, threshold: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>单价（元）</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="input"
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseForm}>
                  取消
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingPaint ? '保存修改' : '添加'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
