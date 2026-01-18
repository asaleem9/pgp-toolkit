import { useState, useEffect } from 'react';
import { Navigation, TabType } from './components/Navigation';
import { GenerateForm } from './components/GenerateForm';
import { EncryptForm } from './components/EncryptForm';
import { DecryptForm } from './components/DecryptForm';
import { SignForm } from './components/SignForm';
import { VerifyForm } from './components/VerifyForm';
import { KeyInspector } from './components/KeyInspector';
import { TrustBadge } from './components/TrustBadge';

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('generate');

  // Warn user before leaving if there's sensitive data
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Check if any forms have data - simple check
      const textarea = document.querySelector('textarea') as HTMLTextAreaElement | null;
      const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement | null;
      const hasData = textarea?.value || passwordInput?.value;

      if (hasData) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-mesh bg-gray-50 flex flex-col relative overflow-hidden">
      {/* Animated gradient orbs in background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-primary-200/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" />
        <div className="absolute top-0 -right-4 w-96 h-96 bg-accent-purple/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-accent-cyan/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000" />
      </div>

      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="flex-1 relative z-10">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
          {/* Tab panels */}
          <div
            id="generate-panel"
            role="tabpanel"
            aria-labelledby="generate-tab"
            hidden={activeTab !== 'generate'}
            className="animate-slide-up"
          >
            {activeTab === 'generate' && <GenerateForm />}
          </div>

          <div
            id="encrypt-panel"
            role="tabpanel"
            aria-labelledby="encrypt-tab"
            hidden={activeTab !== 'encrypt'}
            className="animate-slide-up"
          >
            {activeTab === 'encrypt' && <EncryptForm />}
          </div>

          <div
            id="decrypt-panel"
            role="tabpanel"
            aria-labelledby="decrypt-tab"
            hidden={activeTab !== 'decrypt'}
            className="animate-slide-up"
          >
            {activeTab === 'decrypt' && <DecryptForm />}
          </div>

          <div
            id="sign-panel"
            role="tabpanel"
            aria-labelledby="sign-tab"
            hidden={activeTab !== 'sign'}
            className="animate-slide-up"
          >
            {activeTab === 'sign' && <SignForm />}
          </div>

          <div
            id="verify-panel"
            role="tabpanel"
            aria-labelledby="verify-tab"
            hidden={activeTab !== 'verify'}
            className="animate-slide-up"
          >
            {activeTab === 'verify' && <VerifyForm />}
          </div>

          <div
            id="inspect-panel"
            role="tabpanel"
            aria-labelledby="inspect-tab"
            hidden={activeTab !== 'inspect'}
            className="animate-slide-up"
          >
            {activeTab === 'inspect' && <KeyInspector />}
          </div>

          {/* Trust Badge */}
          <TrustBadge className="mt-8" />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200/50 bg-white/60 backdrop-blur-lg relative z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-secondary">
            <div className="flex items-center gap-4">
              <a
                href="https://github.com/asaleem9/pgp-toolkit"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors font-medium flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
                Open Source
              </a>
              <span className="text-gray-300">|</span>
              <span className="text-gray-400 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                100% Client-Side
              </span>
              <span className="text-gray-300">|</span>
              <span className="text-gray-400 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Zero Data Collection
              </span>
            </div>
            <div className="text-gray-400">
              Powered by{' '}
              <a
                href="https://openpgpjs.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors font-medium"
              >
                OpenPGP.js
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
