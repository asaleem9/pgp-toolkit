import { useState, useRef, useCallback } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

interface QRCodeDisplayProps {
  value: string;
  onClose: () => void;
}

// QR codes have practical limits - about 2953 bytes for alphanumeric
const MAX_QR_LENGTH = 2500;

export function QRCodeDisplay({ value, onClose }: QRCodeDisplayProps) {
  const [downloading, setDownloading] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const isTooBig = value.length > MAX_QR_LENGTH;

  const handleDownload = useCallback(() => {
    setDownloading(true);
    try {
      const canvas = canvasRef.current?.querySelector('canvas');
      if (!canvas) return;

      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = 'qrcode.png';
      link.href = url;
      link.click();
    } finally {
      setDownloading(false);
    }
  }, []);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">QR Code</h3>
          <button
            onClick={onClose}
            className="p-1 text-secondary hover:text-primary transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {isTooBig ? (
          <div className="p-4 bg-warning/10 border border-warning/30 rounded-lg">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-warning flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div>
                <p className="font-medium text-warning">Content too large for QR code</p>
                <p className="text-sm text-warning/80 mt-1">
                  QR codes work best with content under {MAX_QR_LENGTH.toLocaleString()} characters.
                  Your content is {value.length.toLocaleString()} characters.
                </p>
                <p className="text-sm text-warning/80 mt-2">
                  Consider using the download feature instead.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div ref={canvasRef} className="flex justify-center p-4 bg-white">
              <QRCodeCanvas
                value={value}
                size={256}
                level="M"
                includeMargin
                bgColor="#ffffff"
                fgColor="#000000"
              />
            </div>

            <p className="text-xs text-secondary text-center mt-2">
              Scan this QR code to get the content ({value.length.toLocaleString()} characters)
            </p>

            <div className="mt-4 flex gap-2">
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="flex-1 py-2 px-4 bg-primary text-white font-medium rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 transition-colors"
              >
                {downloading ? 'Downloading...' : 'Download PNG'}
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
