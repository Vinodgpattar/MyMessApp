import { useQuery } from '@tanstack/react-query'
import { generateQRCode, QRCodeData } from '@/lib/qr-code'

export function useQRCode() {
  return useQuery<QRCodeData, Error>({
    queryKey: ['qr-code'],
    queryFn: generateQRCode,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  })
}


