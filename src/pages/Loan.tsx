import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import LoanApplication from '@/components/LoanApplication';
import LoanRepayment from '@/components/LoanRepayment';
import LoanHistory from '@/components/LoanHistory';
import UserAssets from '@/components/UserAssets';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MIN_LOAN_AMOUNT, MAX_LOAN_AMOUNT } from '@/contexts/LoanContext';

const Loan = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 lg:pt-24 pb-12">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="mb-8">
            <h1 className="font-display text-3xl lg:text-4xl font-bold mb-2">
              Cryptocurrency Loans
            </h1>
            <p className="text-muted-foreground">
              Borrow {MIN_LOAN_AMOUNT.toLocaleString()} - {MAX_LOAN_AMOUNT.toLocaleString()} USDT with 7 days interest-free!
            </p>
          </div>

          {/* Loan Terms Info */}
          <div className="bg-card border border-border rounded-xl p-4 mb-6">
            <h3 className="font-semibold mb-3">📋 Loan Terms</h3>
            <div className="grid md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-blue-500">💰</span>
                <div>
                  <p className="font-medium">Amount Limit</p>
                  <p className="text-muted-foreground">{MIN_LOAN_AMOUNT.toLocaleString()} - {MAX_LOAN_AMOUNT.toLocaleString()} USDT</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <div>
                  <p className="font-medium">Days 1-7</p>
                  <p className="text-muted-foreground">Interest-free period</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-yellow-500">⚠</span>
                <div>
                  <p className="font-medium">Days 8-15</p>
                  <p className="text-muted-foreground">1% daily interest</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-red-500">✕</span>
                <div>
                  <p className="font-medium">After Day 15</p>
                  <p className="text-muted-foreground">2% daily penalty</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Tabs defaultValue="apply" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger value="apply">Apply</TabsTrigger>
                  <TabsTrigger value="repay">Repayment</TabsTrigger>
                  <TabsTrigger value="history">History</TabsTrigger>
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
    </div>
  );
};

export default Loan;
