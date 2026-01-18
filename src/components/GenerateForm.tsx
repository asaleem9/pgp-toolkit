import { useEffect, useState } from 'react';
import { useGenerate, KeyAlgorithm, ECCCurve, RSABits } from '../hooks/useGenerate';
import { OutputDisplay } from './OutputDisplay';
import { formatFingerprint } from '../utils/pgp';

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

  useEffect(() => {
    return () => {
      clearAll();
    };
  }, [clearAll]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await generate();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-soft border border-gray-200/50 p-6 hover:shadow-lg transition-shadow duration-300">
        <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <span className="w-1 h-6 bg-gradient-to-b from-primary-500 to-primary-600 rounded-full" />
          Generate PGP Key Pair
        </h2>
        <p className="text-sm text-secondary mb-6">
          Create a new public/private key pair for encrypting, decrypting, and signing messages.
        </p>

        {/* Step 1: Identity */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white text-sm font-semibold shadow-md">
              1
            </span>
            <span className="text-sm font-semibold text-gray-900">Your Identity</span>
          </div>
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
          <div className="flex items-center gap-3 mb-4">
            <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white text-sm font-semibold shadow-md">
              2
            </span>
            <span className="text-sm font-semibold text-gray-900">Passphrase Protection</span>
            <span className="text-xs text-secondary">(Recommended)</span>
          </div>
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
                autoComplete="new-password"
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
                  autoComplete="new-password"
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
        <button
          type="submit"
          disabled={isLoading || !name.trim() || !email.trim()}
          className="w-full py-3 px-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-xl hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Generating Keys...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              Generate Key Pair
            </span>
          )}
        </button>
      </div>

      {/* Generated Keys Output */}
      {generatedKeys && (
        <div className="bg-gradient-to-br from-success/5 to-success/10 backdrop-blur-sm rounded-2xl shadow-soft border border-success/20 p-6 animate-slide-up">
          <div className="flex items-center gap-3 mb-4">
            <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-success to-success/90 text-white text-sm font-semibold shadow-md">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </span>
            <span className="text-sm font-semibold text-gray-900">Your New Key Pair</span>
          </div>

          {/* Key Info */}
          <div className="mb-4 p-4 bg-white/50 rounded-xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-xs font-medium text-secondary uppercase">Key ID</dt>
                <dd className="mt-1 font-mono text-gray-900">0x{generatedKeys.keyId.slice(-16)}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-secondary uppercase">Fingerprint</dt>
                <dd className="mt-1 font-mono text-gray-900 text-xs">{formatFingerprint(generatedKeys.fingerprint)}</dd>
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
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
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
            className="mt-4 text-sm font-medium text-secondary hover:text-primary transition-colors"
          >
            Clear & Generate Another
          </button>
        </div>
      )}
    </form>
  );
}
