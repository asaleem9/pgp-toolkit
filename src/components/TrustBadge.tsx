interface TrustBadgeProps {
  className?: string;
}

export function TrustBadge({ className = '' }: TrustBadgeProps) {
  return (
    <div
      className={`bg-primary-50 border border-primary-200 rounded-lg p-4 ${className}`}
      role="status"
      aria-label="Security information"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <svg
            className="w-6 h-6 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-primary text-sm">
            All operations happen locally in your browser
          </h3>
          <p className="text-secondary text-sm mt-1">
            Your keys and messages never leave your device. No data is sent to any server.
          </p>
        </div>
      </div>
    </div>
  );
}
