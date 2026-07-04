import { useEffect } from 'react';
import { useEncrypt, Recipient } from '../hooks/useEncrypt';
import { KeyInput } from './KeyInput';
import { MessageInput } from './MessageInput';
import { OutputDisplay } from './OutputDisplay';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { SectionHeading } from './ui/SectionHeading';
import { StepBadge } from './ui/StepBadge';
import { LockIcon, PlusIcon, XIcon } from './ui/icons';

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
          <XIcon />
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
    errorField,
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
      <Card>
        <SectionHeading>Encrypt a Message</SectionHeading>

        {/* Step 1: Public Keys */}
        <div className="mb-6">
          <StepBadge step="1">
            {recipients.length > 1 ? 'Enter Recipients\' Public Keys' : 'Enter Recipient\'s Public Key'}
          </StepBadge>

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
              <PlusIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
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
          <StepBadge step="2">Enter Your Message</StepBadge>
          <MessageInput
            id="plaintext-message"
            label=""
            placeholder="Type your secret message here..."
            value={message}
            onChange={setMessage}
            error={errorField === 'message' ? error : null}
            rows={6}
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

        {/* Encrypt button */}
        <Button
          type="submit"
          disabled={isLoading || !hasValidRecipients || !message.trim()}
          loading={isLoading}
          loadingText="Encrypting..."
          icon={<LockIcon />}
        >
          Encrypt Message
        </Button>
      </Card>

      {/* Step 3: Output */}
      {encryptedOutput && (
        <Card tone="success" className="animate-rise">
          <StepBadge tone="success">Encrypted Output</StepBadge>
          <OutputDisplay
            id="encrypted-output"
            label=""
            value={encryptedOutput}
            showDownload
            downloadFilename="encrypted-message.asc"
          />

          <Button variant="ghost" onClick={clearAll} className="mt-4">
            Clear All & Start Over
          </Button>
        </Card>
      )}
    </form>
  );
}
