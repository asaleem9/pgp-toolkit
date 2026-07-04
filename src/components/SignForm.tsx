import { useEffect } from 'react';
import { useSign } from '../hooks/useSign';
import { KeyInput } from './KeyInput';
import { MessageInput } from './MessageInput';
import { OutputDisplay } from './OutputDisplay';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { SectionHeading } from './ui/SectionHeading';
import { StepBadge } from './ui/StepBadge';

export function SignForm() {
  const {
    privateKey,
    passphrase,
    message,
    signedOutput,
    keyInfo,
    error,
    errorField,
    isLoading,
    needsPassphrase,
    detachedSignature,
    setPrivateKey,
    setPassphrase,
    setMessage,
    setDetachedSignature,
    sign,
    clearAll,
    validateKey,
  } = useSign();

  // Clear sensitive data when unmounting
  useEffect(() => {
    return () => {
      clearAll();
    };
  }, [clearAll]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await sign();
  };

  const handleKeyBlur = async () => {
    if (privateKey.trim()) {
      await validateKey();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <SectionHeading>Sign a Message</SectionHeading>

        {/* Step 1: Private Key */}
        <div className="mb-6">
          <StepBadge step="1">Enter Your Private Key</StepBadge>
          <KeyInput
            id="private-key"
            label=""
            placeholder="-----BEGIN PGP PRIVATE KEY BLOCK-----&#10;&#10;Paste your private key here...&#10;&#10;-----END PGP PRIVATE KEY BLOCK-----"
            value={privateKey}
            onChange={setPrivateKey}
            onBlur={handleKeyBlur}
            keyInfo={keyInfo}
            error={errorField === 'privateKey' ? error : null}
            keyType="private"
          />
        </div>

        {/* Step 2: Passphrase (if needed) */}
        {(needsPassphrase || keyInfo?.isEncrypted) && (
          <div className="mb-6">
            <StepBadge step="2">Enter Passphrase</StepBadge>
            <input
              type="password"
              id="passphrase"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                errorField === 'passphrase'
                  ? 'border-error focus:ring-error/20 focus:border-error'
                  : 'border-gray-300 focus:ring-primary/20 focus:border-primary'
              }`}
              placeholder="Enter your passphrase"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              autoComplete="off"
              data-1p-ignore="true"
              data-lpignore="true"
              data-form-type="other"
            />
            {errorField === 'passphrase' && error && (
              <p className="mt-1 text-sm text-error" role="alert">
                {error}
              </p>
            )}
          </div>
        )}

        {/* Step 3: Message */}
        <div className="mb-6">
          <StepBadge step={needsPassphrase || keyInfo?.isEncrypted ? '3' : '2'}>
            Enter Message to Sign
          </StepBadge>
          <MessageInput
            id="message-to-sign"
            label=""
            placeholder="Type the message you want to sign..."
            value={message}
            onChange={setMessage}
            error={errorField === 'message' ? error : null}
            rows={6}
          />
        </div>

        {/* Signature Options */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-700 mb-3">Signature Type</p>
          <div className="space-y-2">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                name="signatureType"
                checked={!detachedSignature}
                onChange={() => setDetachedSignature(false)}
                className="mt-1 text-primary focus:ring-primary"
              />
              <div>
                <span className="text-sm font-medium text-gray-900">Clear-signed message</span>
                <p className="text-xs text-secondary">
                  Message and signature combined into a single readable document
                </p>
              </div>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                name="signatureType"
                checked={detachedSignature}
                onChange={() => setDetachedSignature(true)}
                className="mt-1 text-primary focus:ring-primary"
              />
              <div>
                <span className="text-sm font-medium text-gray-900">Detached signature</span>
                <p className="text-xs text-secondary">
                  Signature only, separate from the original message
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* General error */}
        {errorField === 'general' && error && (
          <div className="mb-4 p-3 bg-error/10 border border-error/20 rounded-lg">
            <p className="text-sm text-error" role="alert">
              {error}
            </p>
          </div>
        )}

        {/* Sign button */}
        <Button
          type="submit"
          disabled={isLoading || !privateKey.trim() || !message.trim()}
          loading={isLoading}
          loadingText="Signing..."
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          }
        >
          Sign Message
        </Button>
      </Card>

      {/* Step 4: Output */}
      {signedOutput && (
        <Card tone="success" className="animate-rise">
          <StepBadge tone="success">
            {detachedSignature ? 'Detached Signature' : 'Signed Message'}
          </StepBadge>
          <OutputDisplay
            id="signed-output"
            label=""
            value={signedOutput}
            showDownload
            downloadFilename={detachedSignature ? 'signature.asc' : 'signed-message.asc'}
          />

          <Button variant="ghost" onClick={clearAll} className="mt-4">
            Clear All & Sign Another Message
          </Button>
        </Card>
      )}
    </form>
  );
}
