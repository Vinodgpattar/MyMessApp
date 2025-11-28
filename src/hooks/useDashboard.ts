import { useQuery } from '@tanstack/react-query'
import {
  getDashboardData,
  getCurrentMealStatus,
  getTodaySummaryWithTrend,
  getQuickStats,
  getAlerts,
  getAttendanceTrend,
  getRecentActivities,
  DashboardData,
  CurrentMealStatus,
  TodaySummaryWithTrend,
  QuickStats,
  Alert,
  AttendanceTrend,
  ActivityItem,
} from '@/lib/dashboard'

export function useDashboardData() {
  return useQuery<DashboardData, Error>({
    queryKey: ['dashboard'],
    queryFn: getDashboardData,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
  })
}

export function useCurrentMealStatus() {
  return useQuery<CurrentMealStatus, Error>({
    queryKey: ['dashboard', 'current-meal'],
    queryFn: getCurrentMealStatus,
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  })
}

export function useTodaySummary() {
  return useQuery<TodaySummaryWithTrend, Error>({
    queryKey: ['dashboard', 'today-summary'],
    queryFn: getTodaySummaryWithTrend,
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  })
}

export function useAttendanceTrend() {
  return useQuery<AttendanceTrend, Error>({
    queryKey: ['dashboard', 'attendance-trend'],
    queryFn: getAttendanceTrend,
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  })
}

export function useRecentActivities() {
  return useQuery<ActivityItem[], Error>({
    queryKey: ['dashboard', 'activities'],
    queryFn: getRecentActivities,
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  })
}

export function useQuickStats() {
  return useQuery<QuickStats, Error>({
    queryKey: ['dashboard', 'quick-stats'],
    queryFn: getQuickStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useAlerts() {
  return useQuery<Alert[], Error>({
    queryKey: ['dashboard', 'alerts'],
    queryFn: getAlerts,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

