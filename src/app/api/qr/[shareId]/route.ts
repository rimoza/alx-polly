import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { shareId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const size = parseInt(searchParams.get('size') || '400');
    const format = searchParams.get('format') || 'png';
    const download = searchParams.get('download') === 'true';

    // Validate shareId exists
    const supabase = await createClient();
    const { data: poll, error } = await supabase
      .from('polls')
      .select('id, title, status')
      .eq('share_id', params.shareId)
      .single();

    if (error || !poll) {
      return NextResponse.json(
        { error: 'Poll not found' },
        { status: 404 }
      );
    }

    if (poll.status !== 'active') {
      return NextResponse.json(
        { error: 'Poll is not active' },
        { status: 400 }
      );
    }

    // Generate share URL
    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/vote/${params.shareId}`;

    // Generate QR code based on format
    let qrCode: string | Buffer;
    let contentType: string;
    let filename: string;

    if (format === 'svg') {
      qrCode = await QRCode.toString(shareUrl, {
        type: 'svg',
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      contentType = 'image/svg+xml';
      filename = `poll-${params.shareId}-qr.svg`;
    } else {
      qrCode = await QRCode.toBuffer(shareUrl, {
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      contentType = 'image/png';
      filename = `poll-${params.shareId}-qr.png`;
    }

    // Set appropriate headers
    const headers = new Headers({
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable', // 1 year cache
    });

    if (download) {
      headers.set('Content-Disposition', `attachment; filename="${filename}"`);
    }

    return new Response(qrCode as BodyInit, { headers });
  } catch (error) {
    console.error('QR code generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate QR code' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { shareId: string } }
) {
  try {
    const body = await request.json();
    const { 
      size = 400, 
      brandColor = '#000000',
      title,
      includeTitle = false 
    } = body;

    // Validate shareId exists
    const supabase = await createClient();
    const { data: poll, error } = await supabase
      .from('polls')
      .select('id, title, status')
      .eq('share_id', params.shareId)
      .single();

    if (error || !poll) {
      return NextResponse.json(
        { error: 'Poll not found' },
        { status: 404 }
      );
    }

    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/vote/${params.shareId}`;

    // Generate custom branded QR code
    const qrDataUrl = await QRCode.toDataURL(shareUrl, {
      width: size,
      margin: 2,
      color: {
        dark: brandColor,
        light: '#FFFFFF',
      },
    });

    // If no custom title needed, return simple QR code
    if (!includeTitle) {
      return NextResponse.json({
        qrCode: qrDataUrl,
        shareUrl,
        downloadUrl: `/api/qr/${params.shareId}?download=true&size=${size}`,
      });
    }

    // For branded version with title, we'd need Canvas API on server
    // For now, return the basic QR code with metadata for client-side rendering
    return NextResponse.json({
      qrCode: qrDataUrl,
      shareUrl,
      title: title || poll.title,
      brandColor,
      downloadUrl: `/api/qr/${params.shareId}?download=true&size=${size}`,
    });
  } catch (error) {
    console.error('Custom QR code generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate custom QR code' },
      { status: 500 }
    );
  }
}