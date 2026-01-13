import { useState } from 'react';
import { ChevronDown, Menu, X, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import ThemeToggle from '@/components/ThemeToggle';
import MetaMaskLogo from '@/components/MetaMaskLogo';
import NotificationBell from '@/components/NotificationBell';
import { useTawkTo } from '@/hooks/useTawkTo';

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Market', href: '/market' },
  { label: 'Smart trading', href: '/trade/BTC' },
  { label: 'Loan', href: '/loan' },
  { label: 'Account', href: '/account' },
];

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { openChat } = useTawkTo();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <MetaMaskLogo size={32} />
            <span className="font-display font-semibold text-lg">MetaMask Trade</span>
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
              onClick={openChat}
              className="nav-link flex items-center gap-1 hover:text-primary transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Customer Service
            </button>
            <Link to="/auth">
              <Button variant="outline" className="btn-outline border-foreground/20">
                Login
              </Button>
            </Link>
            <Link to="/auth">
              <Button className="btn-primary">
                Sign up
              </Button>
            </Link>
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
                  openChat();
                  setMobileMenuOpen(false);
                }}
                className="nav-link py-2 flex items-center gap-2 text-primary"
              >
                <MessageCircle className="w-5 h-5" />
                Customer Service
              </button>
              <div className="flex gap-3 pt-4 border-t border-border">
                <Link to="/auth" className="flex-1">
                  <Button variant="outline" className="btn-outline w-full">
                    Login
                  </Button>
                </Link>
                <Link to="/auth" className="flex-1">
                  <Button className="btn-primary w-full">
                    Sign up
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
