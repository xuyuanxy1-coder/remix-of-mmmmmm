import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BottomNav from '@/components/BottomNav';
import LoanApplication from '@/components/LoanApplication';
import LoanRepayment from '@/components/LoanRepayment';
import LoanHistory from '@/components/LoanHistory';
import UserAssets from '@/components/UserAssets';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MIN_LOAN_AMOUNT, MAX_LOAN_AMOUNT } from '@/contexts/LoanContext';
import { useLanguage } from '@/contexts/LanguageContext';

const Loan = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background pb-16 lg:pb-0">
      <Navbar />
      <main className="pt-20 lg:pt-24 pb-12">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="mb-8">
            <h1 className="font-display text-3xl lg:text-4xl font-bold mb-2">
              {t('loan.title')}
            </h1>
            <p className="text-muted-foreground">
              {t('loan.description').replace('{min}', MIN_LOAN_AMOUNT.toLocaleString()).replace('{max}', MAX_LOAN_AMOUNT.toLocaleString())}
            </p>
          </div>

          {/* Loan Terms Info */}
          <div className="bg-card border border-border rounded-xl p-4 mb-6">
            <h3 className="font-semibold mb-3">📋 {t('loan.terms')}</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-blue-500">💰</span>
                <div>
                  <p className="font-medium">{t('loan.amountLimit')}</p>
                  <p className="text-muted-foreground">{MIN_LOAN_AMOUNT.toLocaleString()} - {MAX_LOAN_AMOUNT.toLocaleString()} USDT</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <div>
                  <p className="font-medium">{t('loan.days1to7')}</p>
                  <p className="text-muted-foreground">{t('loan.interestFreePeriod')}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-yellow-500">⚠</span>
                <div>
                  <p className="font-medium">{t('loan.days8to15')}</p>
                  <p className="text-muted-foreground">{t('loan.dailyInterest')}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-red-500">✕</span>
                <div>
                  <p className="font-medium">{t('loan.afterDay15')}</p>
                  <p className="text-muted-foreground">{t('loan.dailyPenalty')}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-orange-500">🔒</span>
                <div>
                  <p className="font-medium">{t('loan.withdrawalLock')}</p>
                  <p className="text-muted-foreground">{t('loan.cannotWithdraw')}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Tabs defaultValue="apply" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger value="apply">{t('loan.apply')}</TabsTrigger>
                  <TabsTrigger value="repay">{t('loan.repayment')}</TabsTrigger>
                  <TabsTrigger value="history">{t('loan.history')}</TabsTrigger>
                </TabsList>
                <TabsContent value="apply">
                  <LoanApplication />
                </TabsContent>
                <TabsContent value="repay">
                  <LoanRepayment />
                </TabsContent>
                <TabsContent value="history">
                  <LoanHistory />
                </TabsContent>
              </Tabs>
            </div>
            <div>
              <UserAssets />
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
};

export default Loan;
