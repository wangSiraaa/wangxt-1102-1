const STORAGE_KEYS = {
  SEATS: 'studio_seats',
  PAINTS: 'studio_paints',
  BOOKINGS: 'studio_bookings',
  WORKS: 'studio_works',
}

const DEFAULT_SEATS = [
  { id: 'S001', name: '1号座位', location: '东区A区', cleanStatus: 'cleaned', isActive: true },
  { id: 'S002', name: '2号座位', location: '东区A区', cleanStatus: 'cleaned', isActive: true },
  { id: 'S003', name: '3号座位', location: '东区A区', cleanStatus: 'dirty', isActive: true },
  { id: 'S004', name: '4号座位', location: '东区B区', cleanStatus: 'cleaning', isActive: true },
  { id: 'S005', name: '5号座位', location: '东区B区', cleanStatus: 'cleaned', isActive: true },
  { id: 'S006', name: '6号座位', location: '西区C区', cleanStatus: 'cleaned', isActive: false },
]

const DEFAULT_PAINTS = [
  { id: 'P001', name: '钛白', color: '#FFFFFF', stock: 50, unit: '管', threshold: 10, price: 15 },
  { id: 'P002', name: '柠檬黄', color: '#FFF44F', stock: 35, unit: '管', threshold: 10, price: 18 },
  { id: 'P003', name: '朱红', color: '#E34234', stock: 8, unit: '管', threshold: 10, price: 20 },
  { id: 'P004', name: '群青', color: '#4169E1', stock: 25, unit: '管', threshold: 10, price: 22 },
  { id: 'P005', name: '翠绿', color: '#50C878', stock: 5, unit: '管', threshold: 10, price: 25 },
  { id: 'P006', name: '赭石', color: '#CC7722', stock: 30, unit: '管', threshold: 10, price: 16 },
  { id: 'P007', name: '紫罗兰', color: '#8F00FF', stock: 15, unit: '管', threshold: 8, price: 28 },
  { id: 'P008', name: '炭黑', color: '#1A1A1A', stock: 40, unit: '管', threshold: 10, price: 12 },
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
    paintIds: ['P001', 'P002', 'P004'],
    status: 'booked',
    workSubmitted: false,
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
    paintIds: ['P001', 'P003', 'P006', 'P008'],
    status: 'booked',
    workSubmitted: false,
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
    paintIds: ['P008'],
    status: 'completed',
    workSubmitted: true,
    workId: 'W001',
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

  getBookings: () => loadData(STORAGE_KEYS.BOOKINGS, DEFAULT_BOOKINGS),
  saveBookings: (data) => saveData(STORAGE_KEYS.BOOKINGS, data),

  getWorks: () => loadData(STORAGE_KEYS.WORKS, DEFAULT_WORKS),
  saveWorks: (data) => saveData(STORAGE_KEYS.WORKS, data),

  resetAll: () => {
    saveData(STORAGE_KEYS.SEATS, DEFAULT_SEATS)
    saveData(STORAGE_KEYS.PAINTS, DEFAULT_PAINTS)
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
