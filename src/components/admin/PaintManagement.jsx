import React, { useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { paintService, paintPackageService } from '../../services/business.js'
import { COURSE_LIST } from '../../data/storage.js'

export default function PaintManagement() {
  const { paints, paintPackages, refreshPaints, refreshPaintPackages, showNotification } = useApp()
  const [activeTab, setActiveTab] = useState('paints')

  const [showForm, setShowForm] = useState(false)
  const [editingPaint, setEditingPaint] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    color: '#CCCCCC',
    stock: 0,
    unit: '管',
    threshold: 10,
    price: 0,
    restrictedCourses: [],
  })
  const [filter, setFilter] = useState('all')

  const [showPackageForm, setShowPackageForm] = useState(false)
  const [editingPackage, setEditingPackage] = useState(null)
  const [packageFormData, setPackageFormData] = useState({
    name: '',
    description: '',
    paintIds: [],
    includedAmount: 1,
    price: 0,
    applicableCourses: [],
    isActive: true,
  })

  const lowStockPaints = paints.filter(p => p.stock <= p.threshold)
  const restrictedPaints = paints.filter(p => p.restrictedCourses && p.restrictedCourses.length > 0)

  const handleOpenForm = (paint = null) => {
    setEditingPaint(paint)
    setFormData(paint ? { ...paint, restrictedCourses: paint.restrictedCourses || [] } : {
      name: '',
      color: '#CCCCCC',
      stock: 0,
      unit: '管',
      threshold: 10,
      price: 0,
      restrictedCourses: [],
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
        restrictedCourses: formData.restrictedCourses || [],
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

  const toggleRestrictedCourse = (course) => {
    setFormData(prev => {
      const courses = prev.restrictedCourses || []
      if (courses.includes(course)) {
        return { ...prev, restrictedCourses: courses.filter(c => c !== course) }
      } else {
        return { ...prev, restrictedCourses: [...courses, course] }
      }
    })
  }

  const filteredPaints = paints.filter(p => {
    if (filter === 'low') return p.stock <= p.threshold
    if (filter === 'out') return p.stock <= 0
    if (filter === 'restricted') return p.restrictedCourses && p.restrictedCourses.length > 0
    return true
  })

  const handleOpenPackageForm = (pkg = null) => {
    setEditingPackage(pkg)
    setPackageFormData(pkg ? { ...pkg } : {
      name: '',
      description: '',
      paintIds: [],
      includedAmount: 1,
      price: 0,
      applicableCourses: [],
      isActive: true,
    })
    setShowPackageForm(true)
  }

  const handleClosePackageForm = () => {
    setShowPackageForm(false)
    setEditingPackage(null)
  }

  const handlePackageSubmit = (e) => {
    e.preventDefault()
    if (!packageFormData.name.trim()) {
      showNotification('请输入套餐名称', 'error')
      return
    }
    if (packageFormData.paintIds.length === 0) {
      showNotification('请至少选择一种颜料', 'error')
      return
    }
    try {
      const data = {
        ...packageFormData,
        includedAmount: Number(packageFormData.includedAmount),
        price: Number(packageFormData.price),
        applicableCourses: packageFormData.applicableCourses || [],
        paintIds: packageFormData.paintIds,
      }
      if (editingPackage) {
        paintPackageService.updatePackage(editingPackage.id, data)
        showNotification('套餐更新成功', 'success')
      } else {
        paintPackageService.addPackage(data)
        showNotification('套餐添加成功', 'success')
      }
      refreshPaintPackages()
      handleClosePackageForm()
    } catch (err) {
      showNotification(err.message, 'error')
    }
  }

  const handlePackageDelete = (packageId) => {
    if (!confirm('确定要删除该套餐吗？')) return
    try {
      paintPackageService.deletePackage(packageId)
      refreshPaintPackages()
      showNotification('套餐删除成功', 'success')
    } catch (err) {
      showNotification(err.message, 'error')
    }
  }

  const togglePackagePaint = (paintId) => {
    setPackageFormData(prev => {
      const ids = prev.paintIds || []
      if (ids.includes(paintId)) {
        return { ...prev, paintIds: ids.filter(id => id !== paintId) }
      } else {
        return { ...prev, paintIds: [...ids, paintId] }
      }
    })
  }

  const togglePackageCourse = (course) => {
    setPackageFormData(prev => {
      const courses = prev.applicableCourses || []
      if (courses.includes(course)) {
        return { ...prev, applicableCourses: courses.filter(c => c !== course) }
      } else {
        return { ...prev, applicableCourses: [...courses, course] }
      }
    })
  }

  const togglePackageActive = (packageId) => {
    try {
      paintPackageService.toggleActive(packageId)
      refreshPaintPackages()
      showNotification('状态更新成功', 'success')
    } catch (err) {
      showNotification(err.message, 'error')
    }
  }

  return (
    <div className="module-container">
      <div className="module-header">
        <h2 className="module-title">颜料管理</h2>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div className="module-tabs">
            <button
              className={`module-tab ${activeTab === 'paints' ? 'active' : ''}`}
              onClick={() => setActiveTab('paints')}
            >
              🎨 颜料库存
            </button>
            <button
              className={`module-tab ${activeTab === 'packages' ? 'active' : ''}`}
              onClick={() => setActiveTab('packages')}
            >
              📦 颜料套餐
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'paints' && (
        <>
          <div className="module-subheader">
            <select
              className="input"
              value={filter}
              onChange={e => setFilter(e.target.value)}
              style={{ width: '150px' }}
            >
              <option value="all">全部颜料</option>
              <option value="low">库存不足</option>
              <option value="out">缺货</option>
              <option value="restricted">限制课程</option>
            </select>
            <button className="btn btn-primary" onClick={() => handleOpenForm()}>
              + 添加颜料
            </button>
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

          {restrictedPaints.length > 0 && (
            <div className="alert alert-info">
              <strong>🔒 课程限制：</strong>以下颜料因短缺仅开放部分课程使用：
              {restrictedPaints.map((p, i) => (
                <span key={p.id} className="alert-tag">
                  {p.name}（限：{p.restrictedCourses.join('、')}）{i < restrictedPaints.length - 1 ? '、' : ''}
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
            <div className="stat-card stat-purple">
              <div className="stat-number">{restrictedPaints.length}</div>
              <div className="stat-label">限制课程</div>
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
                  <th>限制课程</th>
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
                      {paint.restrictedCourses && paint.restrictedCourses.length > 0 ? (
                        <div className="restricted-courses-cell">
                          {paint.restrictedCourses.slice(0, 2).map(c => (
                            <span key={c} className="tag tag-info" style={{ marginRight: '4px', fontSize: '11px' }}>
                              {c}
                            </span>
                          ))}
                          {paint.restrictedCourses.length > 2 && (
                            <span className="muted-text-sm">+{paint.restrictedCourses.length - 2}</span>
                          )}
                        </div>
                      ) : (
                        <span className="muted-text">无限制</span>
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
        </>
      )}

      {activeTab === 'packages' && (
        <>
          <div className="module-subheader">
            <span className="muted-text">共 {paintPackages.length} 个套餐</span>
            <button className="btn btn-primary" onClick={() => handleOpenPackageForm()}>
              + 添加套餐
            </button>
          </div>

          <div className="package-grid-admin">
            {paintPackages.map(pkg => {
              const pkgPaints = pkg.paintIds.map(id => paints.find(p => p.id === id)).filter(Boolean)
              return (
                <div key={pkg.id} className={`package-card-admin ${pkg.isActive ? '' : 'inactive'}`}>
                  <div className="package-card-header">
                    <div className="package-card-title">{pkg.name}</div>
                    <span className={`tag ${pkg.isActive ? 'tag-success' : 'tag-secondary'}`}>
                      {pkg.isActive ? '启用' : '停用'}
                    </span>
                  </div>
                  <div className="package-card-desc muted-text-sm">{pkg.description}</div>
                  <div className="package-card-meta">
                    <div className="meta-row">
                      <span className="muted-text">包含颜料：</span>
                      <span className="font-medium">{pkgPaints.length} 种</span>
                    </div>
                    <div className="meta-row">
                      <span className="muted-text">每份数量：</span>
                      <span className="font-medium">× {pkg.includedAmount}</span>
                    </div>
                    <div className="meta-row">
                      <span className="muted-text">价格：</span>
                      <span className="font-medium price">¥{pkg.price}</span>
                    </div>
                    <div className="meta-row">
                      <span className="muted-text">适用课程：</span>
                      <span className="font-medium">
                        {pkg.applicableCourses && pkg.applicableCourses.length > 0
                          ? pkg.applicableCourses.length + '门'
                          : '全部'
                        }
                      </span>
                    </div>
                  </div>
                  <div className="package-card-paints">
                    {pkgPaints.slice(0, 5).map(p => (
                      <span key={p.id} className="paint-tag paint-tag-xs">
                        <span className="paint-tag-color" style={{ backgroundColor: p.color, border: '1px solid #ddd' }} />
                        {p.name}
                      </span>
                    ))}
                    {pkgPaints.length > 5 && (
                      <span className="muted-text-sm">+{pkgPaints.length - 5}</span>
                    )}
                  </div>
                  <div className="package-card-actions">
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => togglePackageActive(pkg.id)}
                    >
                      {pkg.isActive ? '停用' : '启用'}
                    </button>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => handleOpenPackageForm(pkg)}
                    >
                      编辑
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handlePackageDelete(pkg.id)}
                    >
                      删除
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={handleCloseForm}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
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
              <div className="form-group">
                <label>
                  课程使用限制
                  <span className="muted-text" style={{ marginLeft: '8px' }}>
                    （勾选表示因库存短缺，暂不开放该课程使用此颜料）
                  </span>
                </label>
                <div className="course-restrict-grid">
                  {COURSE_LIST.map(course => {
                    const checked = (formData.restrictedCourses || []).includes(course)
                    return (
                      <label
                        key={course}
                        className={`course-restrict-item ${checked ? 'checked' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleRestrictedCourse(course)}
                        />
                        <span>{course}</span>
                      </label>
                    )
                  })}
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

      {showPackageForm && (
        <div className="modal-overlay" onClick={handleClosePackageForm}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingPackage ? '编辑套餐' : '添加套餐'}</h3>
              <button className="close-btn" onClick={handleClosePackageForm}>×</button>
            </div>
            <form className="modal-body" onSubmit={handlePackageSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>套餐名称 *</label>
                  <input
                    type="text"
                    className="input"
                    value={packageFormData.name}
                    onChange={e => setPackageFormData({ ...packageFormData, name: e.target.value })}
                    placeholder="如：基础水彩套装"
                  />
                </div>
                <div className="form-group">
                  <label>价格（元）</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="input"
                    value={packageFormData.price}
                    onChange={e => setPackageFormData({ ...packageFormData, price: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>套餐描述</label>
                <textarea
                  className="input"
                  rows="2"
                  value={packageFormData.description}
                  onChange={e => setPackageFormData({ ...packageFormData, description: e.target.value })}
                  placeholder="简要描述套餐用途和特点"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>每份数量</label>
                  <input
                    type="number"
                    min="1"
                    className="input"
                    value={packageFormData.includedAmount}
                    onChange={e => setPackageFormData({ ...packageFormData, includedAmount: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>启用状态</label>
                  <select
                    className="input"
                    value={packageFormData.isActive ? '1' : '0'}
                    onChange={e => setPackageFormData({ ...packageFormData, isActive: e.target.value === '1' })}
                  >
                    <option value="1">启用</option>
                    <option value="0">停用</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>
                  适用课程
                  <span className="muted-text" style={{ marginLeft: '8px' }}>
                    （选择该套餐适用于哪些课程，不选则表示全部课程可用）
                  </span>
                </label>
                <div className="course-restrict-grid">
                  {COURSE_LIST.map(course => {
                    const checked = (packageFormData.applicableCourses || []).includes(course)
                    return (
                      <label
                        key={course}
                        className={`course-restrict-item ${checked ? 'checked' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => togglePackageCourse(course)}
                        />
                        <span>{course}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
              <div className="form-group">
                <label>包含颜料 *</label>
                <div className="paint-select-grid">
                  {paints.map(paint => {
                    const checked = (packageFormData.paintIds || []).includes(paint.id)
                    const disabled = paint.stock <= 0
                    return (
                      <label
                        key={paint.id}
                        className={`paint-select-item ${checked ? 'checked' : ''} ${disabled ? 'disabled' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={disabled}
                          onChange={() => !disabled && togglePackagePaint(paint.id)}
                        />
                        <div className="paint-select-content">
                          <div
                            className="color-swatch-sm"
                            style={{ backgroundColor: paint.color, border: '1px solid #ddd' }}
                          />
                          <div>
                            <div className="paint-name">{paint.name}</div>
                            <div className="muted-text-sm">库存：{paint.stock}{paint.unit}</div>
                          </div>
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleClosePackageForm}>
                  取消
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingPackage ? '保存修改' : '添加'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
