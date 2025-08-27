export interface QRCodeResult {
  qrCode: string;
  shareUrl: string;
  title?: string;
  brandColor?: string;
  downloadUrl: string;
}

export async function generatePollQRCode(
  shareId: string,
  options?: {
    size?: number;
    brandColor?: string;
    title?: string;
    includeTitle?: boolean;
  }
): Promise<QRCodeResult> {
  const response = await fetch(`/api/qr/${shareId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(options || {}),
  });

  if (!response.ok) {
    throw new Error('Failed to generate QR code');
  }

  return response.json();
}