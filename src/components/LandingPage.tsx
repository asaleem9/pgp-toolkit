import { TabType } from './Navigation';
import { useScramble } from '../hooks/useScramble';
import { LockIcon } from './ui/icons';

interface LandingPageProps {
  onNavigate: (tab: TabType) => void;
}

const securityFeatures = [
  {
    title: '100% Client-Side',
    description: 'All encryption, decryption, and key operations run entirely in your browser. Nothing leaves your device.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    title: 'No Data Collection',
    description: 'Zero tracking, analytics, or telemetry. No cookies, no accounts, no logs. Your privacy is absolute.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
      </svg>
    ),
  },
  {
    title: 'Open Source',
    description: 'Fully transparent codebase. Audit the code yourself — built on the trusted OpenPGP.js library.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
  },
  {
    title: 'Nothing Stored',
    description: 'No accounts, no cookies, no localStorage. Keys and messages live only in page memory while you work and are gone when you leave.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    ),
  },
];

const quickActions: { label: string; tab: TabType; description: string }[] = [
  { label: 'Decrypt', tab: 'decrypt', description: 'Decrypt a PGP message' },
  { label: 'Encrypt', tab: 'encrypt', description: 'Encrypt a message with PGP' },
  { label: 'Generate Keys', tab: 'generate', description: 'Create a new PGP key pair' },
];

const HEADLINE_LINE_1 = 'PGP encryption,';
const HEADLINE_LINE_2 = 'right in your browser';

export function LandingPage({ onNavigate }: LandingPageProps) {
  const line1 = useScramble(HEADLINE_LINE_1, { duration: 700 });
  const line2 = useScramble(HEADLINE_LINE_2, { duration: 1000 });
  const ornament = useScramble('9C4F 22A7 D3E1 41F0 08BC 77AD', { duration: 1600 });

  return (
    <div>
      {/* Hero */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 text-center">
        <div className="animate-rise stagger-1 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 border border-primary-200 text-primary text-sm font-medium mb-6">
          <LockIcon className="w-4 h-4" />
          100% Client-Side Encryption
        </div>
        <h1
          aria-label={`${HEADLINE_LINE_1} ${HEADLINE_LINE_2}`}
          className="animate-rise stagger-2 relative font-display text-4xl sm:text-5xl font-extrabold text-primary-900 tracking-tight leading-tight"
        >
          {/* Invisible copy reserves the final layout so the scramble never shifts it */}
          <span className="invisible" aria-hidden="true">
            {HEADLINE_LINE_1}
            <br />
            {HEADLINE_LINE_2}
          </span>
          <span className="absolute inset-0" aria-hidden="true">
            {line1.display}
            <br />
            {line2.display}
          </span>
        </h1>
        <p className="animate-rise stagger-3 mt-4 text-lg text-secondary max-w-xl mx-auto">
          Encrypt, decrypt, sign, and verify PGP messages without trusting a server. Your keys and data never leave your device.
        </p>
        <p
          className="animate-rise stagger-4 mt-5 font-mono text-sm text-primary-300 tracking-widest select-none"
          aria-hidden="true"
        >
          {ornament.display}
        </p>
      </div>

      {/* CTA Buttons */}
      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {quickActions.map(({ label, tab, description }, i) => (
            <button
              key={tab}
              onClick={() => onNavigate(tab)}
              className={`animate-rise stagger-${i + 3} flex-1 glass border border-gray-200/50 rounded-xl px-6 py-4 text-left hover:border-primary-300 hover:shadow-glow hover:-translate-y-1 transition-all duration-200 group`}
              aria-label={description}
            >
              <span className="flex items-center justify-between font-semibold text-primary group-hover:text-primary-600 transition-colors">
                {label}
                <span
                  className="text-primary-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all duration-200"
                  aria-hidden="true"
                >
                  →
                </span>
              </span>
              <span className="block text-sm text-secondary mt-0.5">{description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Security Features */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <h2 className="animate-rise stagger-4 font-display text-sm font-semibold text-secondary uppercase tracking-wider text-center mb-6">
          Why it's secure
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {securityFeatures.map((feature, i) => (
            <div
              key={feature.title}
              className={`animate-rise stagger-${i + 3} glass border border-gray-200/50 rounded-xl p-5 hover:border-primary-200 transition-colors duration-200`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 text-primary-600">{feature.icon}</div>
                <div>
                  <h3 className="font-semibold text-primary text-sm">{feature.title}</h3>
                  <p className="text-secondary text-sm mt-1">{feature.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
