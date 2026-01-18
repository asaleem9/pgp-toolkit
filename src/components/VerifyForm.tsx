import { useEffect } from 'react';
import { useVerify } from '../hooks/useVerify';
import { KeyInput } from './KeyInput';
import { DropZone } from './DropZone';

export function VerifyForm() {
  const {
    publicKey,
    signedMessage,
    result,
    keyInfo,
    error,
    isLoading,
    setPublicKey,
    setSignedMessage,
    verify,
    clearAll,
    validateKey,
  } = useVerify();

  // Clear sensitive data when unmounting
  useEffect(() => {
    return () => {
      clearAll();
    };
  }, [clearAll]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await verify();
  };

  const handleKeyBlur = async () => {
    if (publicKey.trim()) {
      await validateKey();
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-soft border border-gray-200/50 p-6 hover:shadow-lg transition-shadow duration-300">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <span className="w-1 h-6 bg-gradient-to-b from-primary-500 to-primary-600 rounded-full" />
          Verify a Signature
        </h2>

        {/* Step 1: Public Key */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white text-sm font-semibold shadow-md">
              1
            </span>
            <span className="text-sm font-semibold text-gray-900">
              Enter Signer's Public Key
            </span>
          </div>
          <KeyInput
            id="verify-public-key"
            label=""
            placeholder="-----BEGIN PGP PUBLIC KEY BLOCK-----&#10;&#10;Paste the signer's public key here...&#10;&#10;-----END PGP PUBLIC KEY BLOCK-----"
            value={publicKey}
            onChange={setPublicKey}
            onBlur={handleKeyBlur}
            keyInfo={keyInfo}
            error={!signedMessage && error && error.includes('public key') ? error : null}
            keyType="public"
          />
        </div>

        {/* Step 2: Signed Message */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white text-sm font-semibold shadow-md">
              2
            </span>
            <span className="text-sm font-semibold text-gray-900">Paste Signed Message</span>
          </div>
          <DropZone onDrop={setSignedMessage} hint="Drop signed message file">
            <textarea
              id="signed-message-input"
              className={`w-full h-40 px-3 py-2 font-mono text-sm border rounded-lg resize-none focus:outline-none focus:ring-2 transition-colors ${
                error && error.includes('message')
                  ? 'border-error focus:ring-error/20 focus:border-error'
                  : 'border-gray-300 focus:ring-primary/20 focus:border-primary'
              }`}
              placeholder="-----BEGIN PGP SIGNED MESSAGE-----&#10;Hash: SHA256&#10;&#10;Your signed message here...&#10;-----BEGIN PGP SIGNATURE-----&#10;...&#10;-----END PGP SIGNATURE-----"
              value={signedMessage}
              onChange={(e) => setSignedMessage(e.target.value)}
              spellCheck={false}
            />
          </DropZone>
          {error && error.includes('message') && (
            <p className="mt-1 text-sm text-error" role="alert">
              {error}
            </p>
          )}
        </div>

        {/* General error */}
        {error && !error.includes('public key') && !error.includes('message') && (
          <div className="mb-4 p-3 bg-error/10 border border-error/20 rounded-lg">
            <p className="text-sm text-error" role="alert">
              {error}
            </p>
          </div>
        )}

        {/* Verify button */}
        <button
          type="submit"
          disabled={isLoading || !publicKey.trim() || !signedMessage.trim()}
          className="w-full py-3 px-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-xl hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Verifying...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Verify Signature
            </span>
          )}
        </button>
      </div>

      {/* Verification Result */}
      {result && (
        <div className={`backdrop-blur-sm rounded-2xl shadow-soft p-6 animate-slide-up ${result.valid ? 'bg-gradient-to-br from-success/5 to-success/10 border border-success/20' : 'bg-gradient-to-br from-error/5 to-error/10 border border-error/20'}`}>
          <div className="flex items-center gap-3 mb-4">
            <span className={`flex items-center justify-center w-8 h-8 rounded-xl text-white text-sm font-semibold shadow-md ${result.valid ? 'bg-gradient-to-br from-success to-success/90' : 'bg-gradient-to-br from-error to-error/90'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {result.valid ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                )}
              </svg>
            </span>
            <span className="text-sm font-semibold text-gray-900">Verification Result</span>
          </div>

          {result.valid ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-success/10 border border-success/20 rounded-lg">
                <svg
                  className="w-8 h-8 text-success flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <p className="font-semibold text-success">Valid Signature</p>
                  <p className="text-sm text-success/80">
                    This message was signed by the provided key and has not been modified.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                {result.signedBy && (
                  <div>
                    <dt className="text-xs font-medium text-secondary uppercase tracking-wide">
                      Signed By
                    </dt>
                    <dd className="mt-1 text-gray-900">{result.signedBy}</dd>
                  </div>
                )}
                {result.signedAt && (
                  <div>
                    <dt className="text-xs font-medium text-secondary uppercase tracking-wide">
                      Signed On
                    </dt>
                    <dd className="mt-1 text-gray-900">{formatDate(result.signedAt)}</dd>
                  </div>
                )}
              </div>

              {result.message && (
                <div>
                  <dt className="text-xs font-medium text-secondary uppercase tracking-wide mb-2">
                    Original Message
                  </dt>
                  <dd className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <pre className="whitespace-pre-wrap text-sm text-gray-900 font-mono">
                      {result.message}
                    </pre>
                  </dd>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 bg-error/10 border border-error/20 rounded-lg">
              <svg
                className="w-8 h-8 text-error flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <p className="font-semibold text-error">Invalid Signature</p>
                <p className="text-sm text-error/80">
                  {result.error || 'The signature could not be verified. The message may have been tampered with or signed by a different key.'}
                </p>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={clearAll}
            className="mt-4 text-sm text-secondary hover:text-primary transition-colors"
          >
            Clear All & Verify Another
          </button>
        </div>
      )}
    </form>
  );
}
