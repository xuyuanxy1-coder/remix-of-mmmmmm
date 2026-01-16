import { useState, forwardRef } from 'react';
import { Menu, X, MessageCircle, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import ThemeToggle from '@/components/ThemeToggle';
import MetaMaskLogo from '@/components/MetaMaskLogo';
import NotificationBell from '@/components/NotificationBell';
import { useTawkTo } from '@/hooks/useTawkTo';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

const Navbar = forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>((props, ref) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { toggleChat } = useTawkTo();
  const { isAdmin, isAuthenticated } = useAuth();
  const { t } = useLanguage();

  const navItems = [
    { label: t('nav.home'), href: '/' },
    { label: t('nav.market'), href: '/market' },
    { label: t('nav.smartTrading'), href: '/trade/BTC' },
    { label: t('nav.loan'), href: '/loan' },
    { label: t('nav.mining'), href: '/mining' },
    { label: t('nav.account'), href: '/account' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <MetaMaskLogo size={32} />
            <span className="font-display font-semibold text-lg">MMTrade</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {navItems.map((item) => (
              item.href.startsWith('/') && !item.href.includes('#') ? (
                <Link key={item.label} to={item.href} className="nav-link">
                  {item.label}
                </Link>
              ) : (
                <a key={item.label} href={item.href} className="nav-link">
                  {item.label}
                </a>
              )
            ))}
          </div>

          {/* Right Side Actions */}
          <div className="hidden lg:flex items-center gap-3">
            <NotificationBell />
            <ThemeToggle />
            <button 
              onClick={toggleChat}
              className="nav-link flex items-center gap-1 hover:text-primary transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              {t('nav.customerService')}
            </button>
            {isAdmin && (
              <Link to="/admin" className="nav-link flex items-center gap-1 text-primary">
                <Shield className="w-4 h-4" />
                {t('nav.admin')}
              </Link>
            )}
            {isAuthenticated ? (
              <Link to="/account">
                <Button className="btn-primary">
                  {t('nav.account')}
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="outline" className="btn-outline border-foreground/20">
                    {t('auth.login')}
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button className="btn-primary">
                    {t('auth.signUp')}
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center gap-2">
            <NotificationBell />
            <ThemeToggle />
            <button
              className="p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-4">
              {navItems.map((item) => (
                item.href.startsWith('/') && !item.href.includes('#') ? (
                  <Link 
                    key={item.label} 
                    to={item.href} 
                    className="nav-link py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <a key={item.label} href={item.href} className="nav-link py-2">
                    {item.label}
                  </a>
                )
              ))}
              <button 
                onClick={() => {
                  toggleChat();
                  setMobileMenuOpen(false);
                }}
                className="nav-link py-2 flex items-center gap-2 text-primary"
              >
                <MessageCircle className="w-5 h-5" />
                {t('nav.customerService')}
              </button>
              {isAdmin && (
                <Link 
                  to="/admin" 
                  className="nav-link py-2 flex items-center gap-2 text-primary"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Shield className="w-5 h-5" />
                  {t('nav.adminPanel')}
                </Link>
              )}
              <div className="flex gap-3 pt-4 border-t border-border">
                {isAuthenticated ? (
                  <Link to="/account" className="flex-1">
                    <Button className="btn-primary w-full">
                      {t('nav.account')}
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link to="/auth" className="flex-1">
                      <Button variant="outline" className="btn-outline w-full">
                        {t('auth.login')}
                      </Button>
                    </Link>
                    <Link to="/auth" className="flex-1">
                      <Button className="btn-primary w-full">
                        {t('auth.signUp')}
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
});

Navbar.displayName = 'Navbar';

export default Navbar;
