import QRCode from 'qrcode';
import { createClient } from '@/lib/supabase/client';

export interface QRCodeOptions {
  size?: number;
  margin?: number;
  darkColor?: string;
  lightColor?: string;
  format?: 'png' | 'svg' | 'utf8';
}

export interface QRCodeResult {
  qrCode: string;
  shareUrl: string;
  downloadUrl?: string;
  title?: string;
  brandColor?: string;
}

/**
 * Generate QR code for poll sharing
 */
export async function generatePollQRCode(
  shareId: string,
  options: QRCodeOptions = {}
): Promise<QRCodeResult> {
  const {
    size = 400,
    margin = 2,
    darkColor = '#000000',
    lightColor = '#FFFFFF',
    format = 'png'
  } = options;

  // Construct the share URL
  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/vote/${shareId}`;
  
  try {
    let dataUrl: string;
    
    if (format === 'svg') {
      dataUrl = await QRCode.toString(shareUrl, {
        type: 'svg',
        width: size,
        margin,
        color: {
          dark: darkColor,
          light: lightColor,
        },
      });
    } else {
      dataUrl = await QRCode.toDataURL(shareUrl, {
        width: size,
        margin,
        color: {
          dark: darkColor,
          light: lightColor,
        },
        rendererOpts: {
          quality: 0.92,
        },
      });
    }

    return {
      qrCode: dataUrl,
      shareUrl,
      downloadUrl: `/api/qr/${shareId}?size=${size}&format=${format}`,
    };
  } catch (error) {
    console.error('Failed to generate QR code:', error);
    throw new Error('QR code generation failed');
  }
}

/**
 * Generate QR code and upload to Supabase Storage
 */
export async function generateAndUploadQRCode(
  pollId: string,
  shareId: string,
  options: QRCodeOptions = {}
): Promise<string> {
  try {
    // Generate QR code as buffer
    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/vote/${shareId}`;
    const qrBuffer = await QRCode.toBuffer(shareUrl, {
      width: options.size || 400,
      margin: options.margin || 2,
      color: {
        dark: options.darkColor || '#000000',
        light: options.lightColor || '#FFFFFF',
      },
    });

    // Upload to Supabase Storage
    const fileName = `qr-codes/${pollId}.png`;
    const supabase = createClient();
    const { data, error } = await supabase.storage
      .from('poll-assets')
      .upload(fileName, qrBuffer, {
        contentType: 'image/png',
        upsert: true,
        cacheControl: '31536000', // 1 year cache
      });

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('poll-assets')
      .getPublicUrl(fileName);

    // Update poll with QR code URL
    const { error: updateError } = await supabase
      .from('polls')
      .update({ qr_code_url: publicUrl })
      .eq('id', pollId);

    if (updateError) {
      console.error('Failed to update poll with QR code URL:', updateError);
    }

    return publicUrl;
  } catch (error) {
    console.error('Failed to generate and upload QR code:', error);
    throw error;
  }
}

/**
 * Create QR code with custom branding
 */
export async function generateBrandedQRCode(
  shareId: string,
  branding?: {
    logo?: string;
    brandColor?: string;
    title?: string;
  }
): Promise<string> {
  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/vote/${shareId}`;
  
  // For branded QR codes, we can use a more advanced library
  // or generate via Canvas API for custom styling
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Canvas context not available');
  }

  // Set canvas size
  canvas.width = 500;
  canvas.height = 600;

  // Generate base QR code
  const qrDataUrl = await QRCode.toDataURL(shareUrl, {
    width: 400,
    margin: 2,
    color: {
      dark: branding?.brandColor || '#000000',
      light: '#FFFFFF',
    },
  });

  // Draw QR code
  const qrImage = new Image();
  qrImage.onload = () => {
    // Clear canvas with white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 500, 600);

    // Draw QR code centered
    ctx.drawImage(qrImage, 50, 100, 400, 400);

    // Add title if provided
    if (branding?.title) {
      ctx.fillStyle = branding.brandColor || '#000000';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(branding.title, 250, 50);
    }

    // Add "Scan to Vote" text
    ctx.fillStyle = '#666666';
    ctx.font = '18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Scan to Vote', 250, 550);
  };
  
  qrImage.src = qrDataUrl;
  
  return new Promise((resolve) => {
    qrImage.onload = () => {
      resolve(canvas.toDataURL('image/png'));
    };
  });
}