import { useState } from 'react';
import { ChevronDown, Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import ThemeToggle from '@/components/ThemeToggle';

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Market', href: '/#market' },
  { label: 'Smart trading', href: '/trade/BTC' },
  { label: 'Loan', href: '#' },
  { label: 'NFTs', href: '#' },
  { label: 'Account', href: '#' },
];

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">M</span>
            </div>
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
            <ThemeToggle />
            <button className="nav-link flex items-center gap-1">
              Customer Service
              <ChevronDown className="w-4 h-4" />
            </button>
            <Button variant="outline" className="btn-outline border-foreground/20">
              Login
            </Button>
            <Button className="btn-primary">
              Sign up
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center gap-2">
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
              <div className="flex gap-3 pt-4 border-t border-border">
                <Button variant="outline" className="btn-outline flex-1">
                  Login
                </Button>
                <Button className="btn-primary flex-1">
                  Sign up
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
