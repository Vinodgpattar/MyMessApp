import { supabase } from './supabase'
import { logger } from './logger'

export interface Plan {
  id: number
  name: string
  meals: string
  price: number
  durationDays: number
  createdAt?: string
  updatedAt?: string
}

export interface CreatePlanData {
  name: string
  meals: string
  price: number
  durationDays: number
}

export interface UpdatePlanData {
  name?: string
  meals?: string
  price?: number
  durationDays?: number
}

/**
 * Get all plans
 */
export async function getPlans(): Promise<{ plans: Plan[]; error: null } | { plans: null; error: Error }> {
  try {
    const { data, error } = await supabase
      .from('Plan')
      .select('id, name, meals, price, durationDays, createdAt, updatedAt')
      .order('createdAt', { ascending: false })

    if (error) {
      logger.error('Error fetching plans', error as Error)
      return { plans: null, error: new Error(error.message) }
    }

    // Convert price from Decimal to number
    const plans = (data || []).map((plan) => ({
      id: plan.id,
      name: plan.name,
      meals: plan.meals,
      price: typeof plan.price === 'string' ? parseFloat(plan.price) : plan.price,
      durationDays: plan.durationDays,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
    }))

    return { plans, error: null }
  } catch (error) {
    logger.error('Unexpected error fetching plans', error as Error)
    return {
      plans: null,
      error: error instanceof Error ? error : new Error('Failed to fetch plans'),
    }
  }
}

/**
 * Get a single plan by ID
 */
export async function getPlanById(id: number): Promise<{ plan: Plan | null; error: null } | { plan: null; error: Error }> {
  try {
    const { data, error } = await supabase
      .from('Plan')
      .select('id, name, meals, price, durationDays, createdAt, updatedAt')
      .eq('id', id)
      .single()

    if (error) {
      logger.error('Error fetching plan', error as Error)
      return { plan: null, error: new Error(error.message) }
    }

    if (!data) {
      return { plan: null, error: new Error('Plan not found') }
    }

    // Convert price from Decimal to number
    const plan = {
      id: data.id,
      name: data.name,
      meals: data.meals,
      price: typeof data.price === 'string' ? parseFloat(data.price) : data.price,
      durationDays: data.durationDays,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    }

    return { plan, error: null }
  } catch (error) {
    logger.error('Unexpected error fetching plan', error as Error)
    return {
      plan: null,
      error: error instanceof Error ? error : new Error('Failed to fetch plan'),
    }
  }
}

/**
 * Create a new plan
 */
export async function createPlan(data: CreatePlanData): Promise<{ plan: Plan; error: null } | { plan: null; error: Error }> {
  try {
    // Validate at least one meal is selected
    if (!data.meals || data.meals.trim().length === 0) {
      return { plan: null, error: new Error('Please select at least one meal') }
    }

    // Validate price
    if (data.price <= 0) {
      return { plan: null, error: new Error('Price must be greater than 0') }
    }

    // Validate duration
    if (data.durationDays <= 0) {
      return { plan: null, error: new Error('Duration must be greater than 0') }
    }

    const { data: planData, error } = await supabase
      .from('Plan')
      .insert({
        name: data.name.trim(),
        meals: data.meals.trim(),
        price: data.price,
        durationDays: data.durationDays,
      })
      .select('id, name, meals, price, durationDays, createdAt, updatedAt')
      .single()

    if (error) {
      logger.error('Error creating plan', error as Error)
      
      // Handle unique constraint violation
      if (error.code === '23505' || error.message.includes('unique')) {
        return { plan: null, error: new Error('A plan with this name already exists') }
      }
      
      return { plan: null, error: new Error(error.message) }
    }

    // Convert price from Decimal to number and map snake_case to camelCase
    const plan = {
      id: planData.id,
      name: planData.name,
      meals: planData.meals,
      price: typeof planData.price === 'string' ? parseFloat(planData.price) : planData.price,
      durationDays: planData.duration_days,
      createdAt: planData.created_at,
      updatedAt: planData.updated_at,
    }

    return { plan, error: null }
  } catch (error) {
    logger.error('Unexpected error creating plan', error as Error)
    return {
      plan: null,
      error: error instanceof Error ? error : new Error('Failed to create plan'),
    }
  }
}

/**
 * Update an existing plan
 */
export async function updatePlan(
  id: number,
  data: UpdatePlanData
): Promise<{ plan: Plan | null; error: null } | { plan: null; error: Error }> {
  try {
    const updateData: any = {}

    if (data.name !== undefined) {
      updateData.name = data.name.trim()
    }
    if (data.meals !== undefined) {
      if (data.meals.trim().length === 0) {
        return { plan: null, error: new Error('Please select at least one meal') }
      }
      updateData.meals = data.meals.trim()
    }
    if (data.price !== undefined) {
      if (data.price <= 0) {
        return { plan: null, error: new Error('Price must be greater than 0') }
      }
      updateData.price = data.price
    }
    if (data.durationDays !== undefined) {
      if (data.durationDays <= 0) {
        return { plan: null, error: new Error('Duration must be greater than 0') }
      }
      updateData.durationDays = data.durationDays
    }

    const { data: planData, error } = await supabase
      .from('Plan')
      .update(updateData)
      .eq('id', id)
      .select('id, name, meals, price, durationDays, createdAt, updatedAt')
      .single()

    if (error) {
      logger.error('Error updating plan', error as Error)
      
      // Handle unique constraint violation
      if (error.code === '23505' || error.message.includes('unique')) {
        return { plan: null, error: new Error('A plan with this name already exists') }
      }
      
      return { plan: null, error: new Error(error.message) }
    }

    if (!planData) {
      return { plan: null, error: new Error('Plan not found') }
    }

    // Convert price from Decimal to number and map snake_case to camelCase
    const plan = {
      id: planData.id,
      name: planData.name,
      meals: planData.meals,
      price: typeof planData.price === 'string' ? parseFloat(planData.price) : planData.price,
      durationDays: planData.duration_days,
      createdAt: planData.created_at,
      updatedAt: planData.updated_at,
    }

    return { plan, error: null }
  } catch (error) {
    logger.error('Unexpected error updating plan', error as Error)
    return {
      plan: null,
      error: error instanceof Error ? error : new Error('Failed to update plan'),
    }
  }
}

/**
 * Delete a plan
 * Checks if plan has active students before deletion
 */
export async function deletePlan(id: number): Promise<{ success: boolean; error: null } | { success: false; error: Error }> {
  try {
    // First, check if plan has any active students
    const { data: students, error: studentsError } = await supabase
      .from('Student')
      .select('id, name')
      .eq('planId', id)
      .eq('isActive', true)
      .limit(1)

    if (studentsError) {
      logger.error('Error checking students', studentsError as Error)
      return { success: false, error: new Error('Failed to check plan usage') }
    }

    if (students && students.length > 0) {
      return {
        success: false,
        error: new Error(
          `Cannot delete plan. It has ${students.length} active student(s). Please remove or reassign students first.`
        ),
      }
    }

    // Delete the plan
    const { error } = await supabase.from('Plan').delete().eq('id', id)

    if (error) {
      logger.error('Error deleting plan', error as Error)
      return { success: false, error: new Error(error.message) }
    }

    return { success: true, error: null }
  } catch (error) {
    logger.error('Unexpected error deleting plan', error as Error)
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Failed to delete plan'),
    }
  }
}

