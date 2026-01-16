import { ArrowRight, TrendingUp, Coins, Pickaxe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

const FeaturesSection = () => {
  const { t } = useLanguage();

  const features = [
    {
      icon: TrendingUp,
      badge: t('features.lowestFees'),
      title: t('features.tradeAllCrypto'),
      description: t('features.cryptoList'),
      color: 'bg-blue-500/10 text-blue-600',
      link: '/trade/BTC',
    },
    {
      icon: Coins,
      badge: t('features.interestFree'),
      title: t('features.cryptoLoans'),
      description: t('features.loanDescription'),
      color: 'bg-green-500/10 text-green-600',
      link: '/loan',
    },
    {
      icon: Pickaxe,
      badge: t('features.highYield'),
      title: t('features.cryptoMining'),
      description: t('features.miningDesc'),
      color: 'bg-amber-500/10 text-amber-600',
      link: '/mining',
    },
  ];

  return (
    <section className="py-16 lg:py-24">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="feature-card group cursor-pointer"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4`}>
                <feature.icon className="w-6 h-6" />
              </div>
              
              <p className="text-xs text-muted-foreground mb-2">{feature.badge}</p>
              
              <h3 className="font-display font-semibold text-lg mb-2">{feature.title}</h3>
              
              <p className="text-sm text-muted-foreground mb-4">{feature.description}</p>
              
              <Link 
                to={feature.link}
                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:gap-2 transition-all duration-200"
              >
                {t('common.getStarted')}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
