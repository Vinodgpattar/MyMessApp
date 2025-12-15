import { supabase } from './supabase'
import * as ImagePicker from 'expo-image-picker'
import * as FileSystem from 'expo-file-system/legacy'
import { logger } from './logger'

export interface SendAnnouncementData {
  title: string
  message: string
  imageUri?: string | null
  targetType: 'all' | 'active' | 'expiring' | 'expired' | 'custom'
  studentIds?: number[]
}

export interface SendAnnouncementResult {
  success: boolean
  notificationId?: number
  totalSent?: number
  error?: string
}

export interface AdminAnnouncement {
  id: number
  title: string
  message: string
  imageUrl: string | null
  sentBy: string
  sentAt: string
  targetType: string
  targetStudentIds: string | null
  readCount: number
  totalSent: number
}

/**
 * Read file as ArrayBuffer for Supabase Storage upload
 * (Same pattern as rental app)
 */
const readFileAsArrayBuffer = async (uri: string): Promise<ArrayBuffer> => {
  try {
    // Use legacy FileSystem API (works with Expo SDK 54)
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    })

    // Convert base64 to ArrayBuffer
    const binaryString = atob(base64)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    
    return bytes.buffer
  } catch (error) {
    logger.error('Error reading file', error as Error)
    throw new Error(`Failed to read image file: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Image upload validation constants
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_IMAGE_DIMENSION = 2048 // Max width or height in pixels

/**
 * Validate image file before upload
 */
async function validateImageFile(imageUri: string): Promise<{ valid: true } | { valid: false; error: Error }> {
  try {
    // Get file info
    const fileInfo = await FileSystem.getInfoAsync(imageUri)
    if (!fileInfo.exists) {
      return { valid: false, error: new Error('Image file does not exist') }
    }

    // Check file size
    if (fileInfo.size && fileInfo.size > MAX_FILE_SIZE) {
      const sizeMB = (fileInfo.size / (1024 * 1024)).toFixed(2)
      return {
        valid: false,
        error: new Error(`Image file is too large (${sizeMB}MB). Maximum size is 5MB.`),
      }
    }

    // Validate file extension
    const uriLower = imageUri.toLowerCase()
    const hasValidExtension = ['.jpg', '.jpeg', '.png', '.webp'].some((ext) => uriLower.endsWith(ext))
    if (!hasValidExtension) {
      return {
        valid: false,
        error: new Error('Invalid image format. Please use JPEG, PNG, or WebP.'),
      }
    }

    return { valid: true }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error : new Error('Failed to validate image file'),
    }
  }
}

/**
 * Upload image to Supabase Storage
 * (Uses same pattern as rental app)
 * Includes validation for file size and type
 */
export async function uploadNotificationImage(
  imageUri: string
): Promise<{ imageUrl: string | null; error: null } | { imageUrl: null; error: Error }> {
  try {
    // Validate image before upload
    const validation = await validateImageFile(imageUri)
    if (!validation.valid) {
      return { imageUrl: null, error: validation.error }
    }

    // Get file extension
    const filename = `notification-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`
    const filePath = `notifications/${filename}`

    // Read file as ArrayBuffer (same as rental app)
    const arrayBuffer = await readFileAsArrayBuffer(imageUri)

    // Upload to Supabase Storage using ArrayBuffer
    const { data, error } = await supabase.storage
      .from('notification-images')
      .upload(filePath, arrayBuffer, {
        contentType: 'image/jpeg',
        upsert: false,
      })

    if (error) {
      return { imageUrl: null, error: new Error(`Failed to upload image: ${error.message}`) }
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('notification-images')
      .getPublicUrl(filePath)

    return { imageUrl: urlData.publicUrl, error: null }
  } catch (error) {
    logger.error('Error uploading image', error as Error)
    return {
      imageUrl: null,
      error: error instanceof Error ? error : new Error('Failed to upload image'),
    }
  }
}

/**
 * Send announcement to students
 * Fully independent - uses Supabase Edge Function directly
 */
export async function sendAnnouncement(
  data: SendAnnouncementData
): Promise<SendAnnouncementResult> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return { success: false, error: 'Not authenticated' }
    }

    // Upload image if provided
    let imageUrl: string | null = null
    if (data.imageUri) {
      const uploadResult = await uploadNotificationImage(data.imageUri)
      if (uploadResult.error) {
        return { success: false, error: uploadResult.error.message }
      }
      imageUrl = uploadResult.imageUrl
    }

    // Call Supabase Edge Function
    const { data: result, error: functionError } = await supabase.functions.invoke('send-announcement', {
      body: {
        title: data.title,
        message: data.message,
        imageUrl,
        targetType: data.targetType,
        studentIds: data.targetType === 'custom' ? data.studentIds : undefined,
      },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    })

    if (functionError) {
      return { success: false, error: functionError.message || 'Failed to send announcement' }
    }

    if (result?.error) {
      return { success: false, error: result.error }
    }

    return {
      success: true,
      notificationId: result?.notificationId,
      totalSent: result?.totalSent,
    }
  } catch (error) {
    logger.error('Error sending announcement', error as Error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send announcement',
    }
  }
}

/**
 * Fetch all announcements sent by admin
 */
export async function getAdminAnnouncements(): Promise<{ announcements: AdminAnnouncement[]; error: null } | { announcements: []; error: Error }> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return { announcements: [], error: new Error('Not authenticated') }
    }

    const { data, error } = await supabase
      .from('AdminNotification')
      .select('*')
      .eq('sentBy', session.user.id)
      .order('sentAt', { ascending: false })

    if (error) {
      return { announcements: [], error: new Error(error.message) }
    }

    // Get read counts and total sent counts for each announcement
    const announcementsWithStats = await Promise.all(
      (data || []).map(async (announcement) => {
        const { count: readCount } = await supabase
          .from('AdminNotificationRecipient')
          .select('*', { count: 'exact', head: true })
          .eq('notificationId', announcement.id)
          .eq('read', true)

        const { count: totalSent } = await supabase
          .from('AdminNotificationRecipient')
          .select('*', { count: 'exact', head: true })
          .eq('notificationId', announcement.id)

        return {
          ...announcement,
          readCount: readCount || 0,
          totalSent: totalSent || 0,
        } as AdminAnnouncement
      })
    )

    return { announcements: announcementsWithStats, error: null }
  } catch (error) {
    logger.error('Error fetching announcements', error as Error)
    return {
      announcements: [],
      error: error instanceof Error ? error : new Error('Failed to fetch announcements'),
    }
  }
}

/**
 * Fetch a single admin announcement by ID
 */
export async function getAdminAnnouncementById(
  id: number
): Promise<{ announcement: AdminAnnouncement | null; error: null } | { announcement: null; error: Error }> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return { announcement: null, error: new Error('Not authenticated') }
    }

    const { data, error } = await supabase
      .from('AdminNotification')
      .select('*')
      .eq('id', id)
      .eq('sentBy', session.user.id)
      .single()

    if (error) {
      return { announcement: null, error: new Error(error.message) }
    }

    if (!data) {
      return { announcement: null, error: new Error('Announcement not found') }
    }

    // Get read count and total sent count
    const { count: readCount } = await supabase
      .from('AdminNotificationRecipient')
      .select('*', { count: 'exact', head: true })
      .eq('notificationId', id)
      .eq('read', true)

    const { count: totalSent } = await supabase
      .from('AdminNotificationRecipient')
      .select('*', { count: 'exact', head: true })
      .eq('notificationId', id)

    return {
      announcement: {
        ...data,
        readCount: readCount || 0,
        totalSent: totalSent || 0,
      } as AdminAnnouncement,
      error: null,
    }
  } catch (error) {
    logger.error('Error fetching announcement by ID', error as Error)
    return {
      announcement: null,
      error: error instanceof Error ? error : new Error('Failed to fetch announcement'),
    }
  }
}

/**
 * Delete a single admin announcement (and its image) by ID
 */
export async function deleteAdminAnnouncement(
  id: number
): Promise<{ success: boolean; error?: Error }> {
  try {
    // Get current record to read imageUrl
    const { data, error: fetchError } = await supabase
      .from('AdminNotification')
      .select('imageUrl')
      .eq('id', id)
      .single()

    if (fetchError) {
      return { success: false, error: new Error(fetchError.message) }
    }

    const imageUrl = data?.imageUrl as string | null

    // Delete DB row
    const { error: deleteError } = await supabase
      .from('AdminNotification')
      .delete()
      .eq('id', id)

    if (deleteError) {
      return { success: false, error: new Error(deleteError.message) }
    }

    // Best-effort: delete image from storage if we can extract the path
    // URL format: .../storage/v1/object/public/notification-images/path/to/file.jpg
    if (imageUrl) {
      try {
        const match = imageUrl.match(/\/notification-images\/(.+)$/)
        if (match && match[1]) {
          const filePath = match[1]
          await supabase.storage.from('notification-images').remove([filePath])
        }
      } catch (e) {
        logger.warn('Failed to delete announcement image from storage', e as Error, { id, imageUrl })
      }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Failed to delete announcement'),
    }
  }
}

/**
 * Fetch admin announcements and auto-delete ones older than 3 days
 */
export async function getAdminAnnouncementsWithCleanup(): Promise<
  { announcements: AdminAnnouncement[]; error: null } |
  { announcements: []; error: Error }
> {
  try {
    const base = await getAdminAnnouncements()
    if (base.error) return base

    const now = new Date()
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)

    const recent: AdminAnnouncement[] = []
    const expired: AdminAnnouncement[] = []

    for (const a of base.announcements) {
      const sent = a.sentAt ? new Date(a.sentAt) : null
      if (sent && sent < threeDaysAgo) {
        expired.push(a)
      } else {
        recent.push(a)
      }
    }

    // Fire-and-forget delete for expired ones (cleanup)
    expired.forEach((a) => {
      deleteAdminAnnouncement(a.id).catch((error) => {
        logger.warn('Failed to auto-delete old announcement', error as Error, { id: a.id })
      })
    })

    return { announcements: recent, error: null }
  } catch (error) {
    return {
      announcements: [],
      error: error instanceof Error ? error : new Error('Failed to load announcements'),
    }
  }
}

/**
 * Request image picker permissions
 */
export async function requestImagePickerPermissions(): Promise<boolean> {
  try {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      return false
    }
    return true
  } catch (error) {
    logger.error('Error requesting permissions', error as Error)
    return false
  }
}

/**
 * Pick image from gallery
 */
export async function pickImageFromGallery(): Promise<{ uri: string | null; error: null } | { uri: null; error: Error }> {
  try {
    const hasPermission = await requestImagePickerPermissions()
    if (!hasPermission) {
      return { uri: null, error: new Error('Permission to access media library is required') }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    })

    if (result.canceled) {
      // User canceled - return null without error
      return { uri: null, error: null }
    }

    if (result.assets && result.assets.length > 0) {
      return { uri: result.assets[0].uri, error: null }
    }

    return { uri: null, error: new Error('No image selected') }
  } catch (error) {
    logger.error('Error picking image', error as Error)
    return {
      uri: null,
      error: error instanceof Error ? error : new Error('Failed to pick image'),
    }
  }
}

/**
 * Take photo with camera
 */
export async function takePhotoWithCamera(): Promise<{ uri: string | null; error: null } | { uri: null; error: Error }> {
  try {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== 'granted') {
      return { uri: null, error: new Error('Permission to access camera is required') }
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    })

    if (result.canceled) {
      // User canceled - return null without error
      return { uri: null, error: null }
    }

    if (result.assets && result.assets.length > 0) {
      return { uri: result.assets[0].uri, error: null }
    }

    return { uri: null, error: new Error('No photo captured') }
  } catch (error) {
    logger.error('Error taking photo', error as Error)
    return {
      uri: null,
      error: error instanceof Error ? error : new Error('Failed to take photo'),
    }
  }
}
