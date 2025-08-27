'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Download, Copy, Share2, Palette, QrCode } from 'lucide-react';
import { toast } from 'sonner';
import { generatePollQRCode, QRCodeResult } from '@/lib/qr-code';

interface QRCodeGeneratorProps {
  shareId: string;
  pollTitle: string;
  onQRGenerated?: (qrResult: QRCodeResult) => void;
}

export function QRCodeGenerator({ 
  shareId, 
  pollTitle, 
  onQRGenerated 
}: QRCodeGeneratorProps) {
  const [qrResult, setQrResult] = useState<QRCodeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [customization, setCustomization] = useState({
    size: 400,
    brandColor: '#000000',
    includeTitle: false,
    customTitle: '',
  });

  // Generate QR code on mount
  useEffect(() => {
    generateQRCode();
  }, [shareId]);

  const generateQRCode = async () => {
    if (!shareId) return;
    
    setLoading(true);
    try {
      const result = await generatePollQRCode(shareId, {
        size: customization.size,
        brandColor: customization.brandColor,
      });
      
      setQrResult(result);
      onQRGenerated?.(result);
    } catch (error) {
      toast.error('Failed to generate QR code');
      console.error('QR generation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomize = async () => {
    setLoading(true);
    try {
      // Call API for custom QR code generation
      const response = await fetch(`/api/qr/${shareId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customization),
      });

      if (!response.ok) {
        throw new Error('Failed to generate custom QR code');
      }

      const data = await response.json();
      setQrResult({
        qrCode: data.qrCode,
        shareUrl: data.shareUrl,
        downloadUrl: data.downloadUrl,
        title: data.title,
        brandColor: data.brandColor,
      });

      toast.success('QR code customized successfully!');
    } catch (error) {
      toast.error('Failed to customize QR code');
      console.error('QR customization error:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyShareUrl = async () => {
    if (!qrResult) return;
    
    try {
      await navigator.clipboard.writeText(qrResult.shareUrl);
      toast.success('Share URL copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy URL');
    }
  };

  const downloadQR = () => {
    if (!qrResult) return;
    
    const link = document.createElement('a');
    link.href = qrResult.downloadUrl || qrResult.qrCode;
    link.download = `poll-${shareId}-qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('QR code downloaded!');
  };

  const shareQR = async () => {
    if (!qrResult) return;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Vote on: ${pollTitle}`,
          text: 'Scan this QR code to vote on the poll',
          url: qrResult.shareUrl,
        });
      } catch (error) {
        // User cancelled sharing
        if (error instanceof Error && error.name !== 'AbortError') {
          toast.error('Failed to share');
        }
      }
    } else {
      // Fallback: copy to clipboard
      await copyShareUrl();
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="w-5 h-5" />
          QR Code
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* QR Code Display */}
        <div className="flex justify-center p-4 bg-white rounded-lg border-2 border-dashed border-gray-200">
          {loading ? (
            <div className="w-48 h-48 bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">
              <QrCode className="w-12 h-12 text-gray-400" />
            </div>
          ) : qrResult ? (
            <img 
              src={qrResult.qrCode} 
              alt="QR Code for poll"
              className="w-48 h-48"
            />
          ) : (
            <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center">
              <QrCode className="w-12 h-12 text-gray-400" />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {qrResult && (
          <div className="flex gap-2 justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={copyShareUrl}
              className="flex items-center gap-1"
            >
              <Copy className="w-4 h-4" />
              Copy URL
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadQR}
              className="flex items-center gap-1"
            >
              <Download className="w-4 h-4" />
              Download
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={shareQR}
              className="flex items-center gap-1"
            >
              <Share2 className="w-4 h-4" />
              Share
            </Button>
          </div>
        )}

        {/* Share URL Display */}
        {qrResult && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <Label className="text-sm text-gray-600">Share URL:</Label>
            <div className="flex items-center gap-2 mt-1">
              <Input
                value={qrResult.shareUrl}
                readOnly
                className="text-sm"
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={copyShareUrl}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Customization Options */}
        <div className="border-t pt-4">
          <div className="flex items-center gap-2 mb-3">
            <Palette className="w-4 h-4" />
            <Label className="text-sm font-medium">Customize QR Code</Label>
          </div>
          
          <div className="space-y-3">
            <div>
              <Label htmlFor="size" className="text-sm">Size</Label>
              <Input
                id="size"
                type="number"
                min="200"
                max="800"
                step="50"
                value={customization.size}
                onChange={(e) => setCustomization(prev => ({
                  ...prev,
                  size: parseInt(e.target.value) || 400
                }))}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="color" className="text-sm">Brand Color</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="color"
                  type="color"
                  value={customization.brandColor}
                  onChange={(e) => setCustomization(prev => ({
                    ...prev,
                    brandColor: e.target.value
                  }))}
                  className="w-16 h-9 p-1"
                />
                <Input
                  type="text"
                  value={customization.brandColor}
                  onChange={(e) => setCustomization(prev => ({
                    ...prev,
                    brandColor: e.target.value
                  }))}
                  placeholder="#000000"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="include-title" className="text-sm">
                Include Poll Title
              </Label>
              <Switch
                id="include-title"
                checked={customization.includeTitle}
                onCheckedChange={(checked) => setCustomization(prev => ({
                  ...prev,
                  includeTitle: checked
                }))}
              />
            </div>

            {customization.includeTitle && (
              <div>
                <Label htmlFor="custom-title" className="text-sm">
                  Custom Title (optional)
                </Label>
                <Input
                  id="custom-title"
                  value={customization.customTitle}
                  onChange={(e) => setCustomization(prev => ({
                    ...prev,
                    customTitle: e.target.value
                  }))}
                  placeholder={pollTitle}
                  className="mt-1"
                />
              </div>
            )}

            <Button
              onClick={handleCustomize}
              disabled={loading}
              className="w-full"
              size="sm"
            >
              {loading ? 'Generating...' : 'Apply Customization'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}