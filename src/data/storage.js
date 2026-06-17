const STORAGE_KEYS = {
  SEATS: 'studio_seats',
  PAINTS: 'studio_paints',
  PAINT_PACKAGES: 'studio_paint_packages',
  BOOKINGS: 'studio_bookings',
  WORKS: 'studio_works',
}

const DEFAULT_SEATS = [
  { id: 'S001', name: '1号座位', location: '东区A区', cleanStatus: 'cleaned', isActive: true, inactiveReason: '', inactiveNote: '' },
  { id: 'S002', name: '2号座位', location: '东区A区', cleanStatus: 'cleaned', isActive: true, inactiveReason: '', inactiveNote: '' },
  { id: 'S003', name: '3号座位', location: '东区A区', cleanStatus: 'dirty', isActive: true, inactiveReason: '', inactiveNote: '' },
  { id: 'S004', name: '4号座位', location: '东区B区', cleanStatus: 'cleaning', isActive: true, inactiveReason: '', inactiveNote: '' },
  { id: 'S005', name: '5号座位', location: '东区B区', cleanStatus: 'cleaned', isActive: true, inactiveReason: '', inactiveNote: '' },
  { id: 'S006', name: '6号座位', location: '西区C区', cleanStatus: 'cleaned', isActive: false, inactiveReason: 'repair', inactiveNote: '调色板损坏，等待维修更换' },
]

const DEFAULT_PAINTS = [
  { id: 'P001', name: '钛白', color: '#FFFFFF', stock: 50, unit: '管', threshold: 10, price: 15, restrictedCourses: [] },
  { id: 'P002', name: '柠檬黄', color: '#FFF44F', stock: 35, unit: '管', threshold: 10, price: 18, restrictedCourses: [] },
  { id: 'P003', name: '朱红', color: '#E34234', stock: 8, unit: '管', threshold: 10, price: 20, restrictedCourses: ['油画基础', '丙烯画创作'] },
  { id: 'P004', name: '群青', color: '#4169E1', stock: 25, unit: '管', threshold: 10, price: 22, restrictedCourses: [] },
  { id: 'P005', name: '翠绿', color: '#50C878', stock: 5, unit: '管', threshold: 10, price: 25, restrictedCourses: ['水彩入门', '国画写意', '色彩构成'] },
  { id: 'P006', name: '赭石', color: '#CC7722', stock: 30, unit: '管', threshold: 10, price: 16, restrictedCourses: [] },
  { id: 'P007', name: '紫罗兰', color: '#8F00FF', stock: 15, unit: '管', threshold: 8, price: 28, restrictedCourses: [] },
  { id: 'P008', name: '炭黑', color: '#1A1A1A', stock: 40, unit: '管', threshold: 10, price: 12, restrictedCourses: [] },
]

const DEFAULT_PAINT_PACKAGES = [
  {
    id: 'PKG001',
    name: '基础水彩套装',
    description: '适合水彩入门课程的基础颜料套装',
    paintIds: ['P001', 'P002', 'P004', 'P006', 'P008'],
    includedAmount: 1,
    price: 80,
    applicableCourses: ['水彩入门', '速写练习'],
    isActive: true,
  },
  {
    id: 'PKG002',
    name: '油画经典套装',
    description: '油画基础课程推荐使用的经典配色',
    paintIds: ['P001', 'P003', 'P004', 'P006', 'P007', 'P008'],
    includedAmount: 1,
    price: 120,
    applicableCourses: ['油画基础', '丙烯画创作'],
    isActive: true,
  },
  {
    id: 'PKG003',
    name: '素描专用套装',
    description: '素描和速写课程专用',
    paintIds: ['P008'],
    includedAmount: 3,
    price: 35,
    applicableCourses: ['素描进阶', '速写练习'],
    isActive: true,
  },
  {
    id: 'PKG004',
    name: '国画写意套装',
    description: '国画写意课程专用颜料',
    paintIds: ['P001', 'P003', 'P005', 'P006', 'P008'],
    includedAmount: 1,
    price: 95,
    applicableCourses: ['国画写意'],
    isActive: true,
  },
  {
    id: 'PKG005',
    name: '色彩构成全套装',
    description: '色彩构成课程全套颜料',
    paintIds: ['P001', 'P002', 'P003', 'P004', 'P005', 'P006', 'P007', 'P008'],
    includedAmount: 1,
    price: 160,
    applicableCourses: ['色彩构成', '综合材料'],
    isActive: false,
  },
]

const DEFAULT_BOOKINGS = [
  {
    id: 'B001',
    seatId: 'S001',
    studentId: 'STU001',
    studentName: '张小明',
    date: '2026-06-18',
    timeSlot: '09:00-12:00',
    course: '水彩入门',
    paintPackageId: 'PKG001',
    paintIds: ['P001', 'P002', 'P004', 'P006', 'P008'],
    status: 'booked',
    workSubmitted: false,
    paintUsage: [],
    extraFeeRequired: false,
    extraFeeAmount: 0,
    extraFeeNote: '',
    createTime: '2026-06-16T10:00:00',
  },
  {
    id: 'B002',
    seatId: 'S002',
    studentId: 'STU002',
    studentName: '李小红',
    date: '2026-06-18',
    timeSlot: '14:00-17:00',
    course: '油画基础',
    paintPackageId: 'PKG002',
    paintIds: ['P001', 'P003', 'P006', 'P007', 'P008'],
    status: 'booked',
    workSubmitted: false,
    paintUsage: [],
    extraFeeRequired: false,
    extraFeeAmount: 0,
    extraFeeNote: '',
    createTime: '2026-06-16T11:30:00',
  },
  {
    id: 'B003',
    seatId: 'S005',
    studentId: 'STU003',
    studentName: '王小芳',
    date: '2026-06-17',
    timeSlot: '09:00-12:00',
    course: '素描进阶',
    paintPackageId: 'PKG003',
    paintIds: ['P008'],
    status: 'completed',
    workSubmitted: true,
    workId: 'W001',
    paintUsage: [{ paintId: 'P008', amount: 2 }],
    extraFeeRequired: false,
    extraFeeAmount: 0,
    extraFeeNote: '',
    createTime: '2026-06-15T09:00:00',
  },
]

const DEFAULT_WORKS = [
  {
    id: 'W001',
    bookingId: 'B003',
    studentId: 'STU003',
    studentName: '王小芳',
    title: '静物素描练习',
    description: '陶罐和苹果的组合练习，注重光影表现',
    submitTime: '2026-06-17T11:50:00',
    teacherComment: '',
    score: null,
    reviewStatus: 'pending',
    imageUrl: '',
  },
]

function loadData(key, defaults) {
  try {
    const data = localStorage.getItem(key)
    if (data) {
      return JSON.parse(data)
    }
  } catch (e) {
    console.error('加载数据失败:', key, e)
  }
  saveData(key, defaults)
  return defaults
}

function saveData(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (e) {
    console.error('保存数据失败:', key, e)
  }
}

export const storage = {
  getSeats: () => loadData(STORAGE_KEYS.SEATS, DEFAULT_SEATS),
  saveSeats: (data) => saveData(STORAGE_KEYS.SEATS, data),

  getPaints: () => loadData(STORAGE_KEYS.PAINTS, DEFAULT_PAINTS),
  savePaints: (data) => saveData(STORAGE_KEYS.PAINTS, data),

  getPaintPackages: () => loadData(STORAGE_KEYS.PAINT_PACKAGES, DEFAULT_PAINT_PACKAGES),
  savePaintPackages: (data) => saveData(STORAGE_KEYS.PAINT_PACKAGES, data),

  getBookings: () => loadData(STORAGE_KEYS.BOOKINGS, DEFAULT_BOOKINGS),
  saveBookings: (data) => saveData(STORAGE_KEYS.BOOKINGS, data),

  getWorks: () => loadData(STORAGE_KEYS.WORKS, DEFAULT_WORKS),
  saveWorks: (data) => saveData(STORAGE_KEYS.WORKS, data),

  resetAll: () => {
    saveData(STORAGE_KEYS.SEATS, DEFAULT_SEATS)
    saveData(STORAGE_KEYS.PAINTS, DEFAULT_PAINTS)
    saveData(STORAGE_KEYS.PAINT_PACKAGES, DEFAULT_PAINT_PACKAGES)
    saveData(STORAGE_KEYS.BOOKINGS, DEFAULT_BOOKINGS)
    saveData(STORAGE_KEYS.WORKS, DEFAULT_WORKS)
  },
}

export const CLEAN_STATUS = {
  CLEANED: 'cleaned',
  DIRTY: 'dirty',
  CLEANING: 'cleaning',
}

export const CLEAN_STATUS_TEXT = {
  cleaned: '已清洁',
  dirty: '待清洁',
  cleaning: '清洁中',
}

export const INACTIVE_REASON = {
  NONE: '',
  CLEANING: 'cleaning',
  REPAIR: 'repair',
  OTHER: 'other',
}

export const INACTIVE_REASON_TEXT = {
  '': '正常使用',
  cleaning: '深度清洁中',
  repair: '维修中',
  other: '其他原因',
}

export const BOOKING_STATUS = {
  BOOKED: 'booked',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
}

export const BOOKING_STATUS_TEXT = {
  booked: '已预约',
  completed: '已完成',
  cancelled: '已取消',
}

export const REVIEW_STATUS = {
  PENDING: 'pending',
  REVIEWED: 'reviewed',
}

export const REVIEW_STATUS_TEXT = {
  pending: '待评审',
  reviewed: '已评审',
}

export const TIME_SLOTS = [
  '09:00-12:00',
  '14:00-17:00',
  '18:00-21:00',
]

export const COURSE_LIST = [
  '水彩入门',
  '油画基础',
  '素描进阶',
  '国画写意',
  '色彩构成',
  '速写练习',
  '丙烯画创作',
  '综合材料',
]

export const COURSE_REQUIRED_PAINTS = {
  '水彩入门': ['P001', 'P002', 'P004', 'P005', 'P006', 'P008'],
  '油画基础': ['P001', 'P003', 'P004', 'P006', 'P008'],
  '素描进阶': ['P008'],
  '国画写意': ['P001', 'P003', 'P005', 'P006', 'P008'],
  '色彩构成': ['P001', 'P002', 'P003', 'P004', 'P005', 'P006', 'P007', 'P008'],
  '速写练习': ['P008'],
  '丙烯画创作': ['P001', 'P003', 'P004', 'P006', 'P007', 'P008'],
  '综合材料': ['P001', 'P002', 'P003', 'P004', 'P005', 'P006', 'P007', 'P008'],
}
