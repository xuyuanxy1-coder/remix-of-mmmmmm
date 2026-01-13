import { Apple, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import phoneMockup from '@/assets/phone-mockup.png';

const HeroSection = () => {
  return (
    <section className="pt-24 lg:pt-32 pb-16 lg:pb-24 overflow-hidden">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Left Content */}
          <div className="space-y-8 animate-fade-in-up">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-semibold leading-tight">
              Buy, trade, and hold 350+ cryptocurrencies on ShieldDEX
            </h1>
            
            <Button className="btn-primary inline-flex items-center gap-2 px-8 py-3 text-base">
              <Apple className="w-5 h-5" />
              App Store
            </Button>

            <div className="grid md:grid-cols-2 gap-6 pt-6">
              <div className="hero-badge">
                <Star className="w-4 h-4 text-primary fill-primary" />
                <div>
                  <p className="font-medium text-foreground">Application</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Mobile banking that throws out the role book and gives you a precision tool for managing your finances.
                  </p>
                </div>
              </div>
              <div className="hero-badge">
                <Star className="w-4 h-4 text-primary fill-primary" />
                <div>
                  <p className="font-medium text-foreground">Crypto deposit</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    By using cryptocurrency for deposit, an additional layer of security is obtained.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Content - Phone Mockup */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative animate-float">
              <img 
                src={phoneMockup} 
                alt="ShieldDEX Mobile App" 
                className="w-72 md:w-80 lg:w-96 h-auto drop-shadow-2xl"
              />
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-primary/10 rounded-full blur-2xl" />
              <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
