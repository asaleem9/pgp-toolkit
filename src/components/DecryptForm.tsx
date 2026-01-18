import { useEffect } from 'react';
import { useDecrypt } from '../hooks/useDecrypt';
import { KeyInput } from './KeyInput';
import { MessageInput } from './MessageInput';
import { OutputDisplay } from './OutputDisplay';

export function DecryptForm() {
  const {
    privateKey,
    passphrase,
    encryptedMessage,
    decryptedOutput,
    keyInfo,
    error,
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
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-soft border border-gray-200/50 p-6 hover:shadow-lg transition-shadow duration-300">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <span className="w-1 h-6 bg-gradient-to-b from-primary-500 to-primary-600 rounded-full" />
          Decrypt a Message
        </h2>

        {/* Step 1: Private Key */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white text-sm font-semibold shadow-md">
              1
            </span>
            <span className="text-sm font-semibold text-gray-900">Enter Your Private Key</span>
          </div>
          <KeyInput
            id="private-key"
            label=""
            placeholder="-----BEGIN PGP PRIVATE KEY BLOCK-----&#10;&#10;Paste your private key here...&#10;&#10;-----END PGP PRIVATE KEY BLOCK-----"
            value={privateKey}
            onChange={setPrivateKey}
            onBlur={handleKeyBlur}
            keyInfo={keyInfo}
            error={error && error.includes('private key') ? error : null}
            keyType="private"
          />
        </div>

        {/* Step 2: Passphrase (conditional) */}
        {(needsPassphrase || (keyInfo && keyInfo.isEncrypted)) && (
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white text-sm font-semibold shadow-md">
                2
              </span>
              <span className="text-sm font-semibold text-gray-900">
                Enter Passphrase (key is protected)
              </span>
            </div>
            <div className="space-y-2">
              <input
                type="password"
                id="passphrase"
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                  error && error.includes('passphrase')
                    ? 'border-error focus:ring-error/20 focus:border-error'
                    : 'border-gray-300 focus:ring-primary/20 focus:border-primary'
                }`}
                placeholder="Enter your passphrase"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                autoComplete="current-password"
              />
              {error && error.includes('passphrase') && (
                <p className="text-sm text-error" role="alert">
                  {error}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Encrypted Message */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white text-sm font-semibold shadow-md">
              {needsPassphrase || (keyInfo && keyInfo.isEncrypted) ? '3' : '2'}
            </span>
            <span className="text-sm font-semibold text-gray-900">Paste Encrypted Message</span>
          </div>
          <MessageInput
            id="encrypted-message"
            label=""
            placeholder="-----BEGIN PGP MESSAGE-----&#10;&#10;Paste the encrypted message here...&#10;&#10;-----END PGP MESSAGE-----"
            value={encryptedMessage}
            onChange={setEncryptedMessage}
            error={error && error.includes('PGP message') ? error : null}
            rows={8}
            allowFileUpload
          />
        </div>

        {/* General error */}
        {error &&
          !error.includes('private key') &&
          !error.includes('passphrase') &&
          !error.includes('PGP message') && (
            <div className="mb-4 p-3 bg-error/10 border border-error/20 rounded-lg">
              <p className="text-sm text-error" role="alert">
                {error}
              </p>
            </div>
          )}

        {/* Decrypt button */}
        <button
          type="submit"
          disabled={isLoading || !privateKey.trim() || !encryptedMessage.trim()}
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
              Decrypting...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
              </svg>
              Decrypt Message
            </span>
          )}
        </button>
      </div>

      {/* Step 4: Output */}
      {decryptedOutput && (
        <div className="bg-gradient-to-br from-success/5 to-success/10 backdrop-blur-sm rounded-2xl shadow-soft border border-success/20 p-6 animate-slide-up">
          <div className="flex items-center gap-3 mb-4">
            <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-success to-success/90 text-white text-sm font-semibold shadow-md">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </span>
            <span className="text-sm font-semibold text-gray-900">Decrypted Message</span>
          </div>
          <OutputDisplay
            id="decrypted-output"
            label=""
            value={decryptedOutput}
            showDownload={false}
            monospace={false}
          />

          <button
            type="button"
            onClick={clearAll}
            className="mt-4 text-sm font-medium text-secondary hover:text-primary transition-colors"
          >
            Clear All & Start Over
          </button>
        </div>
      )}
    </form>
  );
}
