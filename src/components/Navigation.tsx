export type TabType = 'home' | 'encrypt' | 'decrypt' | 'sign' | 'verify' | 'inspect' | 'generate';

interface NavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const tabs: { id: TabType; label: string }[] = [
  { id: 'decrypt', label: 'Decrypt' },
  { id: 'encrypt', label: 'Encrypt' },
  { id: 'generate', label: 'Generate' },
  { id: 'sign', label: 'Sign' },
  { id: 'verify', label: 'Verify' },
  { id: 'inspect', label: 'Inspect' },
];

export function Navigation({ activeTab, onTabChange }: NavigationProps) {
  // Roving tabindex: when the landing page is active no tab is selected, so
  // make the first tab the keyboard entry point
  const focusableTab = tabs.some((tab) => tab.id === activeTab) ? activeTab : tabs[0].id;

  const handleTabKeyDown = (
    e: React.KeyboardEvent,
    index: number,
    idSuffix: string
  ) => {
    let next: number | null = null;
    if (e.key === 'ArrowRight') {
      next = (index + 1) % tabs.length;
    } else if (e.key === 'ArrowLeft') {
      next = (index - 1 + tabs.length) % tabs.length;
    } else if (e.key === 'Home') {
      next = 0;
    } else if (e.key === 'End') {
      next = tabs.length - 1;
    }

    if (next !== null) {
      e.preventDefault();
      onTabChange(tabs[next].id);
      document.getElementById(`${tabs[next].id}-tab${idSuffix}`)?.focus();
    }
  };

  return (
    <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-50 shadow-sm">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top row: logo + GitHub link */}
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo — clickable, navigates to home */}
          <button
            className="flex items-center gap-2.5 group"
            onClick={() => onTabChange('home')}
            aria-label="Go to home page"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg blur-md opacity-30 group-hover:opacity-50 transition-opacity" />
              <svg
                className="w-8 h-8 text-primary relative z-10 group-hover:scale-110 transition-transform duration-200"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" strokeWidth={2} />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" strokeWidth={2} />
              </svg>
            </div>
            <span className="font-semibold text-lg text-primary tracking-tight">PGP Tool</span>
          </button>

          {/* Desktop: inline tabs + GitHub link */}
          <nav className="hidden sm:flex items-center gap-1" role="tablist" aria-label="Main navigation">
            {tabs.map((tab, index) => (
              <button
                key={tab.id}
                id={`${tab.id}-tab`}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`${tab.id}-panel`}
                tabIndex={focusableTab === tab.id ? 0 : -1}
                className={`relative px-4 py-2 text-sm font-medium transition-all duration-200 whitespace-nowrap rounded-lg ${
                  activeTab === tab.id
                    ? 'text-primary'
                    : 'text-secondary hover:text-primary hover:bg-gray-50'
                }`}
                onClick={() => onTabChange(tab.id)}
                onKeyDown={(e) => handleTabKeyDown(e, index, '')}
              >
                {activeTab === tab.id && (
                  <span className="absolute inset-x-0 -bottom-px h-0.5 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full" />
                )}
                {tab.label}
              </button>
            ))}
          </nav>

          <a
            href="https://github.com/asaleem9/pgp-toolkit"
            target="_blank"
            rel="noopener noreferrer"
            className="text-secondary hover:text-primary transition-colors"
            aria-label="View on GitHub"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
          </a>
        </div>

        {/* Mobile: tab row below the logo */}
        <nav
          className="sm:hidden -mx-4 px-4 pb-2 flex gap-1 overflow-x-auto scrollbar-hide"
          role="tablist"
          aria-label="Main navigation"
        >
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              id={`${tab.id}-tab-mobile`}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`${tab.id}-panel`}
              tabIndex={focusableTab === tab.id ? 0 : -1}
              className={`relative px-3 py-1.5 text-xs font-medium transition-all duration-200 whitespace-nowrap rounded-full ${
                activeTab === tab.id
                  ? 'text-white bg-primary shadow-sm'
                  : 'text-secondary hover:text-primary bg-gray-100 hover:bg-gray-200'
              }`}
              onClick={() => onTabChange(tab.id)}
              onKeyDown={(e) => handleTabKeyDown(e, index, '-mobile')}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
