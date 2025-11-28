import { logger } from './logger'

export interface QRCodeData {
  qrCode: string // QR code data string (for local generation)
  url: string // The identifier encoded in the QR code
}

/**
 * Generate QR code locally (NO WEB APP DEPENDENCY)
 * Returns the data string that will be encoded in the QR code
 */
export async function generateQRCode(): Promise<QRCodeData> {
  try {
    // Use configured scheme for deep linking support
    // This matches the scheme in app.json: "mess-management"
    // Also supports backward compatibility with "mess://"
    const qrData = 'mess-management://attendance'
    
    // Return the data string - the component will render it using react-native-qrcode-svg
    return {
      qrCode: qrData, // Now this is the data string, not base64
      url: qrData,
    }
  } catch (error) {
    logger.error('Error generating QR code', error as Error)
    throw error instanceof Error 
      ? error 
      : new Error('Failed to generate QR code. Please try again.')
  }
}

