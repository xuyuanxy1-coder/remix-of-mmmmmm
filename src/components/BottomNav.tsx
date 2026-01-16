import React, { forwardRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, BarChart3, TrendingUp, Landmark, User, Shield, Pickaxe } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

const BottomNav = forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>((props, ref) => {
  const location = useLocation();
  const { isAdmin } = useAuth();
  const { t } = useLanguage();

  const navItems = [
    { label: t('nav.home'), href: '/', icon: Home },
    { label: t('nav.market'), href: '/market', icon: BarChart3 },
    { label: t('nav.trade'), href: '/trade/BTC', icon: TrendingUp },
    { label: t('nav.loan'), href: '/loan', icon: Landmark },
    { label: 'Mining', href: '/mining', icon: Pickaxe },
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    if (href === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(href.split('/').slice(0, 2).join('/'));
  };

  const items = isAdmin 
    ? [...navItems.slice(0, 4), { label: t('nav.admin'), href: '/admin', icon: Shield }]
    : navItems;

  return (
    <nav ref={ref} {...props} className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          
          return (
            <Link
              key={item.href}
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
});

BottomNav.displayName = 'BottomNav';

export default BottomNav;
