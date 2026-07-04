import { useEffect, useState, useRef } from 'react';
import { useGenerate, ECCCurve, RSABits } from '../hooks/useGenerate';
import { OutputDisplay } from './OutputDisplay';
import { formatFingerprint } from '../utils/pgp';
import { TrustBadge } from './TrustBadge';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { SectionHeading } from './ui/SectionHeading';
import { StepBadge } from './ui/StepBadge';
import { WarningIcon, XIcon } from './ui/icons';

export function GenerateForm() {
  const {
    name,
    email,
    passphrase,
    confirmPassphrase,
    algorithm,
    curve,
    rsaBits,
    expirationYears,
    generatedKeys,
    error,
    isLoading,
    setName,
    setEmail,
    setPassphrase,
    setConfirmPassphrase,
    setAlgorithm,
    setCurve,
    setRsaBits,
    setExpirationYears,
    generate,
    clearAll,
  } = useGenerate();

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeKeyTab, setActiveKeyTab] = useState<'public' | 'private'>('public');

  // Use ref to avoid useEffect triggering on every clearAll change
  const clearAllRef = useRef(clearAll);
  clearAllRef.current = clearAll;

  useEffect(() => {
    return () => {
      clearAllRef.current();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await generate();
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className={`flex justify-center transition-all duration-500 ease-in-out ${generatedKeys ? 'gap-6' : 'gap-0'}`}>
        {/* Form Panel */}
        <div className={`transition-all duration-500 ease-in-out ${
          generatedKeys
            ? 'w-full max-w-md flex-shrink-0'
            : 'w-full max-w-2xl'
        }`}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <SectionHeading className="mb-2">Generate PGP Key Pair</SectionHeading>
              <p className="text-sm text-secondary mb-6">
                Create a new public/private key pair for encrypting, decrypting, and signing messages.
              </p>

              {/* Step 1: Identity */}
              <div className="mb-6">
                <StepBadge step="1">Your Identity</StepBadge>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="gen-name" className="block text-sm font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      id="gen-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    />
                  </div>
                  <div>
                    <label htmlFor="gen-email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      id="gen-email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="john@example.com"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Step 2: Passphrase */}
              <div className="mb-6">
                <StepBadge step="2" hint="(Recommended)">Passphrase Protection</StepBadge>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="gen-passphrase" className="block text-sm font-medium text-gray-700 mb-1">
                      Passphrase
                    </label>
                    <input
                      type="password"
                      id="gen-passphrase"
                      value={passphrase}
                      onChange={(e) => setPassphrase(e.target.value)}
                      placeholder="Strong passphrase (min 8 characters)"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                      autoComplete="off"
                      data-1p-ignore="true"
                      data-lpignore="true"
                      data-form-type="other"
                    />
                    <p className="mt-1 text-xs text-secondary">
                      Protects your private key. Leave empty for no passphrase (not recommended).
                    </p>
                  </div>
                  {passphrase && (
                    <div>
                      <label htmlFor="gen-confirm-passphrase" className="block text-sm font-medium text-gray-700 mb-1">
                        Confirm Passphrase
                      </label>
                      <input
                        type="password"
                        id="gen-confirm-passphrase"
                        value={confirmPassphrase}
                        onChange={(e) => setConfirmPassphrase(e.target.value)}
                        placeholder="Confirm your passphrase"
                        className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 transition-colors ${
                          confirmPassphrase && passphrase !== confirmPassphrase
                            ? 'border-error focus:ring-error/20 focus:border-error'
                            : 'border-gray-300 focus:ring-primary/20 focus:border-primary'
                        }`}
                        autoComplete="off"
                        data-1p-ignore="true"
                        data-lpignore="true"
                        data-form-type="other"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Advanced Options */}
              <div className="mb-6">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-2 text-sm font-medium text-secondary hover:text-primary transition-colors"
                >
                  <svg
                    className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-90' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  Advanced Options
                </button>

                {showAdvanced && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-xl space-y-4">
                    {/* Algorithm */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Algorithm
                      </label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="algorithm"
                            checked={algorithm === 'ecc'}
                            onChange={() => setAlgorithm('ecc')}
                            className="text-primary focus:ring-primary"
                          />
                          <span className="text-sm">ECC (Recommended)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="algorithm"
                            checked={algorithm === 'rsa'}
                            onChange={() => setAlgorithm('rsa')}
                            className="text-primary focus:ring-primary"
                          />
                          <span className="text-sm">RSA</span>
                        </label>
                      </div>
                    </div>

                    {/* ECC Curve or RSA Bits */}
                    {algorithm === 'ecc' ? (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Curve
                        </label>
                        <select
                          value={curve}
                          onChange={(e) => setCurve(e.target.value as ECCCurve)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        >
                          <option value="curve25519">Curve25519 (Recommended)</option>
                          <option value="p256">NIST P-256</option>
                          <option value="p384">NIST P-384</option>
                          <option value="p521">NIST P-521</option>
                        </select>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Key Size
                        </label>
                        <select
                          value={rsaBits}
                          onChange={(e) => setRsaBits(Number(e.target.value) as RSABits)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        >
                          <option value={4096}>4096 bits (Recommended)</option>
                          <option value={3072}>3072 bits</option>
                          <option value={2048}>2048 bits (Minimum)</option>
                        </select>
                      </div>
                    )}

                    {/* Expiration */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Key Expiration
                      </label>
                      <select
                        value={expirationYears}
                        onChange={(e) => setExpirationYears(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      >
                        <option value={1}>1 year</option>
                        <option value={2}>2 years (Recommended)</option>
                        <option value={3}>3 years</option>
                        <option value={5}>5 years</option>
                        <option value={0}>Never expire</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="mb-4 p-3 bg-error/10 border border-error/20 rounded-lg">
                  <p className="text-sm text-error" role="alert">
                    {error}
                  </p>
                </div>
              )}

              {/* Generate button */}
              <Button
                type="submit"
                disabled={isLoading || !name.trim() || !email.trim()}
                loading={isLoading}
                loadingText="Generating Keys..."
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                }
              >
                Generate Key Pair
              </Button>
            </Card>

            {/* Trust Badge - only show when no keys generated */}
            {!generatedKeys && <TrustBadge className="mt-8" />}
          </form>
        </div>

        {/* Generated Keys Panel - slides in from right */}
        <div className={`transition-all duration-500 ease-in-out overflow-hidden ${
          generatedKeys
            ? 'w-full max-w-xl opacity-100 translate-x-0'
            : 'w-0 max-w-0 opacity-0 translate-x-8'
        }`}>
          {generatedKeys && (
            <Card tone="success" className="h-fit animate-rise">
              <div className="flex items-start justify-between">
                <StepBadge tone="success">Your New Key Pair</StepBadge>
                <button
                  type="button"
                  onClick={clearAll}
                  className="p-2 text-secondary hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                  title="Clear and start over"
                >
                  <XIcon />
                </button>
              </div>

              {/* Key Info */}
              <div className="mb-4 p-4 bg-white/50 rounded-xl">
                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div>
                    <dt className="text-xs font-medium text-secondary uppercase">Key ID</dt>
                    <dd className="mt-1 font-mono text-gray-900">0x{generatedKeys.keyId.slice(-16)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-secondary uppercase">Fingerprint</dt>
                    <dd className="mt-1 font-mono text-gray-900 text-xs break-all">{formatFingerprint(generatedKeys.fingerprint)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-secondary uppercase">Protection</dt>
                    <dd className={`mt-1 text-sm ${generatedKeys.isProtected ? 'text-success' : 'text-warning'}`}>
                      {generatedKeys.isProtected
                        ? 'Private key is passphrase-protected'
                        : 'Private key has NO passphrase'}
                    </dd>
                  </div>
                </div>
              </div>

              {/* Key Tabs */}
              <div className="mb-4">
                <div className="flex gap-2 border-b border-gray-200">
                  <button
                    type="button"
                    onClick={() => setActiveKeyTab('public')}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      activeKeyTab === 'public'
                        ? 'text-primary border-b-2 border-primary'
                        : 'text-secondary hover:text-primary'
                    }`}
                  >
                    Public Key
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveKeyTab('private')}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      activeKeyTab === 'private'
                        ? 'text-warning border-b-2 border-warning'
                        : 'text-secondary hover:text-warning'
                    }`}
                  >
                    Private Key
                  </button>
                </div>
              </div>

              {activeKeyTab === 'public' ? (
                <div>
                  <p className="text-sm text-secondary mb-3">
                    Share this key with others so they can encrypt messages to you.
                  </p>
                  <OutputDisplay
                    id="generated-public-key"
                    label=""
                    value={generatedKeys.publicKey}
                    showDownload
                    downloadFilename={`${email.split('@')[0]}-public.asc`}
                    showQRCode={false}
                  />
                </div>
              ) : (
                <div>
                  <div className="mb-3 p-3 bg-warning/10 border border-warning/30 rounded-lg">
                    <div className="flex items-start gap-2 text-warning">
                      <WarningIcon className="w-5 h-5 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium">Keep this key private!</p>
                        <p className="mt-0.5 text-warning/80">
                          Never share your private key. Store it securely.
                        </p>
                      </div>
                    </div>
                  </div>
                  <OutputDisplay
                    id="generated-private-key"
                    label=""
                    value={generatedKeys.privateKey}
                    showDownload
                    downloadFilename={`${email.split('@')[0]}-private.asc`}
                    showQRCode={false}
                  />
                </div>
              )}

              <button
                type="button"
                onClick={clearAll}
                className="mt-4 w-full py-2 text-sm font-medium text-secondary hover:text-primary border border-gray-200 hover:border-primary rounded-lg transition-colors"
              >
                Generate Another Key Pair
              </button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
