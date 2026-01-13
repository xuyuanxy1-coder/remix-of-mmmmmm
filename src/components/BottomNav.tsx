import { Link, useLocation } from 'react-router-dom';
import { Home, BarChart3, TrendingUp, Landmark, User } from 'lucide-react';

const navItems = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Market', href: '/market', icon: BarChart3 },
  { label: 'Trade', href: '/trade/BTC', icon: TrendingUp },
  { label: 'Loan', href: '/loan', icon: Landmark },
  { label: 'Account', href: '/account', icon: User },
];

const BottomNav = () => {
  const location = useLocation();

  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href.split('/').slice(0, 2).join('/'));
  };

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          
          return (
            <Link
              key={item.label}
              to={item.href}
              className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors ${
                active ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;