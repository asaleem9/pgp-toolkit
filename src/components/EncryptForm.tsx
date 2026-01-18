import { useEffect } from 'react';
import { useEncrypt, Recipient } from '../hooks/useEncrypt';
import { KeyInput } from './KeyInput';
import { MessageInput } from './MessageInput';
import { OutputDisplay } from './OutputDisplay';

function RecipientInput({
  recipient,
  index,
  total,
  onUpdate,
  onValidate,
  onRemove,
}: {
  recipient: Recipient;
  index: number;
  total: number;
  onUpdate: (id: string, key: string) => void;
  onValidate: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="relative">
      <KeyInput
        id={`public-key-${recipient.id}`}
        label={total > 1 ? `Recipient ${index + 1}` : ''}
        placeholder="-----BEGIN PGP PUBLIC KEY BLOCK-----&#10;&#10;Paste the recipient's public key here...&#10;&#10;-----END PGP PUBLIC KEY BLOCK-----"
        value={recipient.key}
        onChange={(key) => onUpdate(recipient.id, key)}
        onBlur={() => onValidate(recipient.id)}
        keyInfo={recipient.keyInfo}
        error={recipient.error}
        keyType="public"
      />
      {total > 1 && (
        <button
          type="button"
          onClick={() => onRemove(recipient.id)}
          className="absolute top-0 right-0 p-1 text-secondary hover:text-error transition-colors"
          title="Remove recipient"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

export function EncryptForm() {
  const {
    recipients,
    message,
    encryptedOutput,
    error,
    isLoading,
    encryptToSelf,
    selfKey,
    selfKeyInfo,
    selfKeyError,
    addRecipient,
    removeRecipient,
    updateRecipient,
    validateRecipient,
    setEncryptToSelf,
    setSelfKey,
    validateSelfKey,
    setMessage,
    encrypt,
    clearAll,
  } = useEncrypt();

  // Clear sensitive data when unmounting
  useEffect(() => {
    return () => {
      clearAll();
    };
  }, [clearAll]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await encrypt();
  };

  const handleValidateRecipient = async (id: string) => {
    const recipient = recipients.find(r => r.id === id);
    if (recipient?.key.trim()) {
      await validateRecipient(id);
    }
  };

  const hasValidRecipients = recipients.some(r => r.key.trim());

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-soft border border-gray-200/50 p-6 hover:shadow-lg transition-shadow duration-300">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <span className="w-1 h-6 bg-gradient-to-b from-primary-500 to-primary-600 rounded-full" />
          Encrypt a Message
        </h2>

        {/* Step 1: Public Keys */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white text-sm font-semibold shadow-md">
              1
            </span>
            <span className="text-sm font-semibold text-gray-900">
              {recipients.length > 1 ? 'Enter Recipients\' Public Keys' : 'Enter Recipient\'s Public Key'}
            </span>
          </div>

          <div className="space-y-4">
            {recipients.map((recipient, index) => (
              <RecipientInput
                key={recipient.id}
                recipient={recipient}
                index={index}
                total={recipients.length}
                onUpdate={updateRecipient}
                onValidate={handleValidateRecipient}
                onRemove={removeRecipient}
              />
            ))}
          </div>

          {recipients.length < 10 && (
            <button
              type="button"
              onClick={addRecipient}
              className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary/5 hover:border-primary/50 transition-all duration-200 group"
            >
              <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Add Another Recipient
            </button>
          )}

          {recipients.length > 1 && (
            <p className="mt-2 text-xs text-secondary">
              Encrypting to {recipients.filter(r => r.key.trim()).length} recipient(s). Each can decrypt with their own private key.
            </p>
          )}

          {/* Encrypt to Self Option */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={encryptToSelf}
                onChange={(e) => setEncryptToSelf(e.target.checked)}
                className="mt-1 text-primary focus:ring-primary rounded"
              />
              <div>
                <span className="text-sm font-medium text-gray-900">
                  Also encrypt to my key
                </span>
                <p className="text-xs text-secondary">
                  This lets you decrypt the message later with your own private key
                </p>
              </div>
            </label>

            {encryptToSelf && (
              <div className="mt-3 pl-7">
                <KeyInput
                  id="self-public-key"
                  label="Your Public Key"
                  placeholder="-----BEGIN PGP PUBLIC KEY BLOCK-----&#10;&#10;Paste your public key here...&#10;&#10;-----END PGP PUBLIC KEY BLOCK-----"
                  value={selfKey}
                  onChange={setSelfKey}
                  onBlur={validateSelfKey}
                  keyInfo={selfKeyInfo}
                  error={selfKeyError}
                  keyType="public"
                />
              </div>
            )}
          </div>
        </div>

        {/* Step 2: Message */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white text-sm font-semibold shadow-md">
              2
            </span>
            <span className="text-sm font-semibold text-gray-900">Enter Your Message</span>
          </div>
          <MessageInput
            id="plaintext-message"
            label=""
            placeholder="Type your secret message here..."
            value={message}
            onChange={setMessage}
            error={error && error.includes('Message') ? error : null}
            rows={6}
          />
        </div>

        {/* General error */}
        {error && !error.includes('public key') && !error.includes('Message') && (
          <div className="mb-4 p-3 bg-error/10 border border-error/20 rounded-lg">
            <p className="text-sm text-error" role="alert">
              {error}
            </p>
          </div>
        )}

        {/* Encrypt button */}
        <button
          type="submit"
          disabled={isLoading || !hasValidRecipients || !message.trim()}
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
              Encrypting...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Encrypt Message
            </span>
          )}
        </button>
      </div>

      {/* Step 3: Output */}
      {encryptedOutput && (
        <div className="bg-gradient-to-br from-success/5 to-success/10 backdrop-blur-sm rounded-2xl shadow-soft border border-success/20 p-6 animate-slide-up">
          <div className="flex items-center gap-3 mb-4">
            <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-success to-success/90 text-white text-sm font-semibold shadow-md">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </span>
            <span className="text-sm font-semibold text-gray-900">Encrypted Output</span>
          </div>
          <OutputDisplay
            id="encrypted-output"
            label=""
            value={encryptedOutput}
            showDownload
            downloadFilename="encrypted-message.asc"
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
