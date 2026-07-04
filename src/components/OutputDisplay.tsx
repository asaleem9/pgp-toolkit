import { useState } from 'react';
import { useClipboard } from '../hooks/useClipboard';
import { QRCodeDisplay } from './QRCodeDisplay';
import { useAnnounce } from '../hooks/useAnnounce';
import { Button } from './ui/Button';
import { CheckIcon, CopyIcon, DownloadIcon, QrCodeIcon } from './ui/icons';

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
  const announce = useAnnounce();

  const handleCopy = () => {
    copy(value);
    announce('Copied to clipboard');
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

      <div className="relative overflow-hidden rounded-xl">
        <textarea
          id={id}
          className={`w-full h-48 px-4 py-3 text-sm border border-gray-300 rounded-xl resize-none bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 ${
            monospace ? 'font-mono' : ''
          }`}
          value={value}
          readOnly
          spellCheck={false}
        />
        {/* One-time highlight sweep when the result appears; purely decorative
            and pointer-transparent so copying/reading the value is unaffected */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/80 to-transparent animate-sweep"
        />
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={handleCopy}
          className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all duration-200 shadow-sm hover:shadow active:scale-[0.97] group ${
            copied
              ? 'bg-gradient-to-r from-success to-emerald-600 focus:ring-success/50'
              : 'bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 focus:ring-primary/50'
          }`}
        >
          {copied ? (
            <>
              <span className="inline-flex animate-pop">
                <CheckIcon />
              </span>
              Copied!
            </>
          ) : (
            <>
              <CopyIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
              Copy to Clipboard
            </>
          )}
        </button>

        {showDownload && (
          <Button
            variant="outline"
            onClick={handleDownload}
            icon={<DownloadIcon className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />}
          >
            Download as .asc
          </Button>
        )}

        {showQRCode && (
          <Button
            variant="outline"
            onClick={() => setShowQR(true)}
            icon={<QrCodeIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />}
          >
            Show QR Code
          </Button>
        )}
      </div>

      {/* QR Code Modal */}
      {showQR && <QRCodeDisplay value={value} onClose={() => setShowQR(false)} />}
    </div>
  );
}
