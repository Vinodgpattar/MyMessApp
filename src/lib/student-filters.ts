import { Student } from './students'
import { differenceInDays } from 'date-fns'

export type FilterType = 'all' | 'active' | 'inactive' | 'expiring' | 'overdue'

export interface FilterCounts {
  all: number
  active: number
  inactive: number
  expiring: number
  overdue: number
}

/**
 * Filter students based on filter type
 */
export function filterStudents(students: Student[], filterType: FilterType): Student[] {
  if (filterType === 'all') {
    return students
  }

  if (filterType === 'active') {
    return students.filter((s) => s.isActive && new Date(s.endDate) >= new Date())
  }

  if (filterType === 'inactive') {
    return students.filter((s) => !s.isActive || new Date(s.endDate) < new Date())
  }

  if (filterType === 'expiring') {
    const today = new Date()
    return students.filter((s) => {
      if (!s.isActive) return false
      const endDate = new Date(s.endDate)
      const daysUntilExpiry = differenceInDays(endDate, today)
      return daysUntilExpiry >= 0 && daysUntilExpiry <= 7
    })
  }

  if (filterType === 'overdue') {
    return students.filter((s) => s.balance > 0 && s.isActive)
  }

  return students
}

/**
 * Calculate filter counts
 */
export function calculateFilterCounts(students: Student[]): FilterCounts {
  const today = new Date()
  
  return {
    all: students.length,
    active: students.filter((s) => s.isActive && new Date(s.endDate) >= today).length,
    inactive: students.filter((s) => !s.isActive || new Date(s.endDate) < today).length,
    expiring: students.filter((s) => {
      if (!s.isActive) return false
      const endDate = new Date(s.endDate)
      const daysUntilExpiry = differenceInDays(endDate, today)
      return daysUntilExpiry >= 0 && daysUntilExpiry <= 7
    }).length,
    overdue: students.filter((s) => s.balance > 0 && s.isActive).length,
  }
}

