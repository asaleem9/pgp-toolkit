import { useState } from 'react';
import { useClipboard } from '../hooks/useClipboard';
import { QRCodeDisplay } from './QRCodeDisplay';

interface OutputDisplayProps {
  label: string;
  value: string;
  id: string;
  showDownload?: boolean;
  downloadFilename?: string;
  monospace?: boolean;
  showQRCode?: boolean;
}

export function OutputDisplay({
  label,
  value,
  id,
  showDownload = false,
  downloadFilename = 'message.asc',
  monospace = true,
  showQRCode = true,
}: OutputDisplayProps) {
  const { copied, copy } = useClipboard();
  const [showQR, setShowQR] = useState(false);

  const handleCopy = () => {
    copy(value);
  };

  const handleDownload = () => {
    const blob = new Blob([value], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = downloadFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!value) {
    return null;
  }

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
      </label>

      <div className="relative">
        <textarea
          id={id}
          className={`w-full h-48 px-4 py-3 text-sm border border-gray-300 rounded-xl resize-none bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 ${
            monospace ? 'font-mono' : ''
          }`}
          value={value}
          readOnly
          spellCheck={false}
        />
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-1 transition-all duration-200 shadow-sm hover:shadow group"
        >
          {copied ? (
            <>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg
                className="w-4 h-4 group-hover:scale-110 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              Copy to Clipboard
            </>
          )}
        </button>

        {showDownload && (
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-secondary border border-gray-300 rounded-lg hover:border-primary hover:text-primary hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200 group"
          >
            <svg
              className="w-4 h-4 group-hover:translate-y-0.5 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Download as .asc
          </button>
        )}

        {showQRCode && (
          <button
            type="button"
            onClick={() => setShowQR(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-secondary border border-gray-300 rounded-lg hover:border-primary hover:text-primary hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200 group"
          >
            <svg
              className="w-4 h-4 group-hover:scale-110 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h2M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
              />
            </svg>
            Show QR Code
          </button>
        )}
      </div>

      {/* QR Code Modal */}
      {showQR && <QRCodeDisplay value={value} onClose={() => setShowQR(false)} />}
    </div>
  );
}
