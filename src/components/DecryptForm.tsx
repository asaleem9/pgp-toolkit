import { useEffect } from 'react';
import { useDecrypt } from '../hooks/useDecrypt';
import { KeyInput } from './KeyInput';
import { MessageInput } from './MessageInput';
import { OutputDisplay } from './OutputDisplay';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { SectionHeading } from './ui/SectionHeading';
import { StepBadge } from './ui/StepBadge';

export function DecryptForm() {
  const {
    privateKey,
    passphrase,
    encryptedMessage,
    decryptedOutput,
    keyInfo,
    error,
    errorField,
    isLoading,
    needsPassphrase,
    setPrivateKey,
    setPassphrase,
    setEncryptedMessage,
    decrypt,
    clearAll,
    validateKey,
  } = useDecrypt();

  // Clear sensitive data when unmounting
  useEffect(() => {
    return () => {
      clearAll();
    };
  }, [clearAll]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await decrypt();
  };

  const handleKeyBlur = async () => {
    if (privateKey.trim()) {
      await validateKey();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <SectionHeading>Decrypt a Message</SectionHeading>

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

        {/* Step 2: Passphrase (conditional) */}
        {(needsPassphrase || (keyInfo && keyInfo.isEncrypted)) && (
          <div className="mb-6">
            <StepBadge step="2">Enter Passphrase (key is protected)</StepBadge>
            <div className="space-y-2">
              <input
                type="password"
                id="passphrase"
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
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
                <p className="text-sm text-error" role="alert">
                  {error}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Encrypted Message */}
        <div className="mb-6">
          <StepBadge step={needsPassphrase || (keyInfo && keyInfo.isEncrypted) ? '3' : '2'}>
            Paste Encrypted Message
          </StepBadge>
          <MessageInput
            id="encrypted-message"
            label=""
            placeholder="-----BEGIN PGP MESSAGE-----&#10;&#10;Paste the encrypted message here...&#10;&#10;-----END PGP MESSAGE-----"
            value={encryptedMessage}
            onChange={setEncryptedMessage}
            error={errorField === 'message' ? error : null}
            rows={8}
            allowFileUpload
          />
        </div>

        {/* General error */}
        {errorField === 'general' && error && (
          <div className="mb-4 p-3 bg-error/10 border border-error/20 rounded-lg">
            <p className="text-sm text-error" role="alert">
              {error}
            </p>
          </div>
        )}

        {/* Decrypt button */}
        <Button
          type="submit"
          disabled={isLoading || !privateKey.trim() || !encryptedMessage.trim()}
          loading={isLoading}
          loadingText="Decrypting..."
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
            </svg>
          }
        >
          Decrypt Message
        </Button>
      </Card>

      {/* Step 4: Output */}
      {decryptedOutput && (
        <Card tone="success" className="animate-rise">
          <StepBadge tone="success">Decrypted Message</StepBadge>
          <OutputDisplay
            id="decrypted-output"
            label=""
            value={decryptedOutput}
            showDownload={false}
            monospace={false}
          />

          <Button variant="ghost" onClick={clearAll} className="mt-4">
            Clear All & Start Over
          </Button>
        </Card>
      )}
    </form>
  );
}
