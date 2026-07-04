import { useEffect } from 'react';
import { useVerify } from '../hooks/useVerify';
import { KeyInput } from './KeyInput';
import { DropZone } from './DropZone';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { SectionHeading } from './ui/SectionHeading';
import { StepBadge } from './ui/StepBadge';

export function VerifyForm() {
  const {
    publicKey,
    signedMessage,
    originalMessage,
    mode,
    result,
    keyInfo,
    error,
    errorField,
    isLoading,
    setPublicKey,
    setSignedMessage,
    setOriginalMessage,
    setMode,
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
      <Card>
        <SectionHeading>Verify a Signature</SectionHeading>

        {/* Step 1: Public Key */}
        <div className="mb-6">
          <StepBadge step="1">Enter Signer's Public Key</StepBadge>
          <KeyInput
            id="verify-public-key"
            label=""
            placeholder="-----BEGIN PGP PUBLIC KEY BLOCK-----&#10;&#10;Paste the signer's public key here...&#10;&#10;-----END PGP PUBLIC KEY BLOCK-----"
            value={publicKey}
            onChange={setPublicKey}
            onBlur={handleKeyBlur}
            keyInfo={keyInfo}
            error={errorField === 'publicKey' ? error : null}
            keyType="public"
          />
        </div>

        {/* Step 2: Signature Type */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-700 mb-3">What are you verifying?</p>
          <div className="space-y-2">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                name="verifyMode"
                checked={mode === 'inline'}
                onChange={() => setMode('inline')}
                className="mt-1 text-primary focus:ring-primary"
              />
              <div>
                <span className="text-sm font-medium text-gray-900">Signed message</span>
                <p className="text-xs text-secondary">
                  A clear-signed document with the message and signature combined
                </p>
              </div>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                name="verifyMode"
                checked={mode === 'detached'}
                onChange={() => setMode('detached')}
                className="mt-1 text-primary focus:ring-primary"
              />
              <div>
                <span className="text-sm font-medium text-gray-900">Detached signature</span>
                <p className="text-xs text-secondary">
                  A separate signature file plus the original message it signs
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Step 3 (detached only): Original Message */}
        {mode === 'detached' && (
          <div className="mb-6">
            <StepBadge step="3">Paste Original Message</StepBadge>
            <DropZone onDrop={setOriginalMessage} hint="Drop original message file">
              <textarea
                id="original-message-input"
                className={`w-full h-32 px-3 py-2 font-mono text-sm border rounded-lg resize-none focus:outline-none focus:ring-2 transition-colors ${
                  errorField === 'originalMessage'
                    ? 'border-error focus:ring-error/20 focus:border-error'
                    : 'border-gray-300 focus:ring-primary/20 focus:border-primary'
                }`}
                placeholder="The exact message that was signed..."
                value={originalMessage}
                onChange={(e) => setOriginalMessage(e.target.value)}
                spellCheck={false}
              />
            </DropZone>
            {errorField === 'originalMessage' && error && (
              <p className="mt-1 text-sm text-error" role="alert">
                {error}
              </p>
            )}
          </div>
        )}

        {/* Signed Message / Signature */}
        <div className="mb-6">
          <StepBadge step={mode === 'detached' ? '4' : '3'}>
            {mode === 'detached' ? 'Paste Signature' : 'Paste Signed Message'}
          </StepBadge>
          <DropZone
            onDrop={setSignedMessage}
            hint={mode === 'detached' ? 'Drop signature file' : 'Drop signed message file'}
          >
            <textarea
              id="signed-message-input"
              className={`w-full h-40 px-3 py-2 font-mono text-sm border rounded-lg resize-none focus:outline-none focus:ring-2 transition-colors ${
                errorField === 'signature'
                  ? 'border-error focus:ring-error/20 focus:border-error'
                  : 'border-gray-300 focus:ring-primary/20 focus:border-primary'
              }`}
              placeholder={
                mode === 'detached'
                  ? '-----BEGIN PGP SIGNATURE-----\n...\n-----END PGP SIGNATURE-----'
                  : '-----BEGIN PGP SIGNED MESSAGE-----\nHash: SHA256\n\nYour signed message here...\n-----BEGIN PGP SIGNATURE-----\n...\n-----END PGP SIGNATURE-----'
              }
              value={signedMessage}
              onChange={(e) => setSignedMessage(e.target.value)}
              spellCheck={false}
            />
          </DropZone>
          {errorField === 'signature' && error && (
            <p className="mt-1 text-sm text-error" role="alert">
              {error}
            </p>
          )}
        </div>

        {/* General error */}
        {errorField === 'general' && error && (
          <div className="mb-4 p-3 bg-error/10 border border-error/20 rounded-lg">
            <p className="text-sm text-error" role="alert">
              {error}
            </p>
          </div>
        )}

        {/* Verify button */}
        <Button
          type="submit"
          disabled={isLoading || !publicKey.trim() || !signedMessage.trim()}
          loading={isLoading}
          loadingText="Verifying..."
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          }
        >
          Verify Signature
        </Button>
      </Card>

      {/* Verification Result */}
      {result && (
        <Card tone={result.valid ? 'success' : 'error'} className="animate-rise">
          <StepBadge tone={result.valid ? 'success' : 'error'}>Verification Result</StepBadge>

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
                {result.signedByKeyId && (
                  <div>
                    <dt className="text-xs font-medium text-secondary uppercase tracking-wide">
                      Signing Key ID
                    </dt>
                    <dd className="mt-1 text-gray-900 font-mono">0x{result.signedByKeyId.slice(-16)}</dd>
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

          <Button variant="ghost" onClick={clearAll} className="mt-4">
            Clear All & Verify Another
          </Button>
        </Card>
      )}
    </form>
  );
}
