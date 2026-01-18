import { ExpiryStatus, getDaysUntilExpiry } from '../utils/pgp';

interface KeyExpiryWarningProps {
  expirationDate: Date | null;
  status: ExpiryStatus;
  keyType: 'public' | 'private';
}

export function KeyExpiryWarning({ expirationDate, status, keyType }: KeyExpiryWarningProps) {
  if (status === 'no-expiry' || status === 'valid') {
    return null;
  }

  const days = getDaysUntilExpiry(expirationDate);
  const formattedDate = expirationDate?.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  if (status === 'expired') {
    return (
      <div className="mt-2 p-2 bg-error/10 border border-error/30 rounded-md">
        <div className="flex items-start gap-2 text-error">
          <svg
            className="w-5 h-5 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div className="text-sm">
            <p className="font-medium">This key expired on {formattedDate}</p>
            <p className="mt-0.5 text-error/80">
              {keyType === 'public'
                ? 'Messages encrypted with this key may not be decryptable.'
                : 'This key should no longer be used for signing.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'expiring-week') {
    return (
      <div className="mt-2 p-2 bg-warning/10 border border-warning/30 rounded-md">
        <div className="flex items-start gap-2 text-warning">
          <svg
            className="w-5 h-5 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="text-sm">
            <p className="font-medium">
              This key expires in {days} day{days !== 1 ? 's' : ''} ({formattedDate})
            </p>
            <p className="mt-0.5 text-warning/80">
              {keyType === 'public'
                ? 'Consider asking the recipient for an updated key.'
                : 'Consider generating a new key soon.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // expiring-soon (within 30 days)
  return (
    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
      <div className="flex items-start gap-2 text-yellow-700">
        <svg
          className="w-5 h-5 flex-shrink-0 mt-0.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div className="text-sm">
          <p className="font-medium">
            This key expires on {formattedDate} ({days} days)
          </p>
        </div>
      </div>
    </div>
  );
}
