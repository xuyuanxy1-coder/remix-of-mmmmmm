import { Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import MetaMaskLogo from '@/components/MetaMaskLogo';
import { useLanguage, Language } from '@/contexts/LanguageContext';

const metamaskLegalUrls = {
  'Privacy Policy': 'https://consensys.io/privacy-policy',
  'Terms of Service': 'https://consensys.io/terms-of-use',
  'Cookies Policy': 'https://consensys.io/privacy-policy#cookies',
  'Risk Disclosure': 'https://metamask.io/risk-warning/',
};

const languages = [
  { code: 'en' as Language, label: 'English' },
  { code: 'es' as Language, label: 'Español' },
  { code: 'hi' as Language, label: 'हिन्दी' },
  { code: 'fr' as Language, label: 'Français' },
  { code: 'ar' as Language, label: 'العربية' },
  { code: 'zh' as Language, label: '中文' },
];

const Footer = () => {
  const { language, setLanguage } = useLanguage();

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lang = e.target.value as Language;
    setLanguage(lang);
  };

  return (
    <footer className="bg-foreground text-background py-16 lg:py-20">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-12">
          {/* Logo & Description */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <MetaMaskLogo size={32} />
              <span className="font-display font-semibold text-lg">MetaMask Trade</span>
            </div>
            <p className="text-background/60 text-sm leading-relaxed mb-6">
              The world's leading cryptocurrency exchange platform. 
              Trade securely with the lowest fees and fastest execution.
            </p>
            
            {/* Language Selector */}
            <div className="flex items-center gap-2 text-sm">
              <Globe className="w-4 h-4 text-background/60" />
              <select 
                className="bg-transparent text-background/80 text-sm border-none outline-none cursor-pointer"
                value={language}
                onChange={handleLanguageChange}
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code} className="text-foreground">
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Products */}
          <div>
            <h4 className="font-display font-semibold mb-4">Products</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/trade" className="text-background/60 text-sm hover:text-background transition-colors">
                  Spot Trading
                </Link>
              </li>
              <li>
                <Link to="/trade" className="text-background/60 text-sm hover:text-background transition-colors">
                  Margin Trading
                </Link>
              </li>
              <li>
                <Link to="/trade" className="text-background/60 text-sm hover:text-background transition-colors">
                  Derivatives
                </Link>
              </li>
              <li>
                <Link to="/loan" className="text-background/60 text-sm hover:text-background transition-colors">
                  Loans
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-display font-semibold mb-4">Services</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/trade" className="text-background/60 text-sm hover:text-background transition-colors">
                  Smart Trading
                </Link>
              </li>
              <li>
                <Link to="/trade" className="text-background/60 text-sm hover:text-background transition-colors">
                  Copy Trading
                </Link>
              </li>
              <li>
                <a href="#" className="text-background/60 text-sm hover:text-background transition-colors">
                  API
                </a>
              </li>
              <li>
                <a href="#" className="text-background/60 text-sm hover:text-background transition-colors">
                  Mobile App
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-display font-semibold mb-4">Support</h4>
            <ul className="space-y-2">
              <li>
                <a 
                  href="#" 
                  className="text-background/60 text-sm hover:text-background transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    // Trigger Tawk.to chat if available
                    if ((window as any).Tawk_API?.maximize) {
                      (window as any).Tawk_API.maximize();
                    }
                  }}
                >
                  Help Center
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className="text-background/60 text-sm hover:text-background transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    // Trigger Tawk.to chat if available
                    if ((window as any).Tawk_API?.maximize) {
                      (window as any).Tawk_API.maximize();
                    }
                  }}
                >
                  Contact Us
                </a>
              </li>
              <li>
                <a href="#" className="text-background/60 text-sm hover:text-background transition-colors">
                  FAQ
                </a>
              </li>
              <li>
                <a href="#" className="text-background/60 text-sm hover:text-background transition-colors">
                  Fees
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-display font-semibold mb-4">Legal</h4>
            <ul className="space-y-2">
              {Object.entries(metamaskLegalUrls).map(([label, url]) => (
                <li key={label}>
                  <a 
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-background/60 text-sm hover:text-background transition-colors"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-background/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-background/40 text-sm">
            © 2024 MetaMask Trade. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a href="#" className="text-background/60 hover:text-background transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            <a href="#" className="text-background/60 hover:text-background transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
              </svg>
            </a>
            <a href="#" className="text-background/60 hover:text-background transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c5.51 0 10-4.48 10-10S17.51 2 12 2zm6.605 4.61a8.502 8.502 0 011.93 5.314c-.281-.054-3.101-.629-5.943-.271-.065-.141-.12-.293-.184-.445a25.416 25.416 0 00-.564-1.236c3.145-1.28 4.577-3.124 4.761-3.362zM12 3.475c2.17 0 4.154.813 5.662 2.148-.152.216-1.443 1.941-4.48 3.08-1.399-2.57-2.95-4.675-3.189-5A8.687 8.687 0 0112 3.475zm-3.633.803a53.896 53.896 0 013.167 4.935c-3.992 1.063-7.517 1.04-7.896 1.04a8.581 8.581 0 014.729-5.975zM3.453 12.01v-.26c.37.01 4.512.065 8.775-1.215.25.477.477.965.694 1.453-.109.033-.228.065-.336.098-4.404 1.42-6.747 5.303-6.942 5.629a8.522 8.522 0 01-2.19-5.705zM12 20.547a8.482 8.482 0 01-5.239-1.8c.152-.315 1.888-3.656 6.703-5.337.022-.01.033-.01.054-.022a35.318 35.318 0 011.823 6.475 8.4 8.4 0 01-3.341.684zm4.761-1.465c-.086-.52-.542-3.015-1.659-6.084 2.679-.423 5.022.271 5.314.369a8.468 8.468 0 01-3.655 5.715z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
