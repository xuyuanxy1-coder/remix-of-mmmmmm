import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Users, FileCheck, History, Settings, LogOut, Shield, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import AdminUserList from '@/components/admin/AdminUserList';
import AdminApplications from '@/components/admin/AdminApplications';
import AdminTransactions from '@/components/admin/AdminTransactions';
import AdminSettings from '@/components/admin/AdminSettings';
import AdminSmartTrades from '@/components/admin/AdminSmartTrades';

interface PendingCounts {
  applications: number;
  trades: number;
}

const Admin = () => {
  const { user, isAdmin, isLoading: authLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('users');
  const [pendingCounts, setPendingCounts] = useState<PendingCounts>({ applications: 0, trades: 0 });

  // Fetch pending counts
  useEffect(() => {
    const fetchPendingCounts = async () => {
      if (!isAdmin) return;

      try {
        // Count pending transactions (deposits + withdrawals)
        const { count: txCount } = await supabase
          .from('transactions')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending')
          .in('type', ['deposit', 'withdraw']);

        // Count pending loans
        const { count: loanCount } = await supabase
          .from('loans')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');

        // Count pending KYC
        const { count: kycCount } = await supabase
          .from('kyc_records')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');

        // Count pending loan repayments
        const { count: repaymentCount } = await supabase
          .from('loan_repayments')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');

        // Count pending trades (manual mode)
        const { count: tradeCount } = await supabase
          .from('transactions')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending')
          .eq('type', 'trade');

        const totalApplications = (txCount || 0) + (loanCount || 0) + (kycCount || 0) + (repaymentCount || 0);

        setPendingCounts({
          applications: totalApplications,
          trades: tradeCount || 0,
        });
      } catch (error) {
        console.error('Error fetching pending counts:', error);
      }
    };

    fetchPendingCounts();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchPendingCounts, 30000);
    return () => clearInterval(interval);
  }, [isAdmin]);

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) return;
    
    // Check if user is authenticated and is admin
    if (!user) {
      toast.error('Please login first');
      navigate('/auth');
      return;
    }

    if (!isAdmin) {
      toast.error('Access denied. Admin only.');
      navigate('/');
      return;
    }
  }, [user, isAdmin, authLoading, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
    toast.success('Logged out successfully');
  };

  // Badge component for notification dots
  const NotificationBadge = ({ count }: { count: number }) => {
    if (count === 0) return null;
    return (
      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1">
        {count > 99 ? '99+' : count}
      </span>
    );
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="font-display font-bold text-lg">管理后台</h1>
                <p className="text-xs text-muted-foreground">欢迎, {user?.username}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">退出登录</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="w-full grid grid-cols-5 h-auto p-1 bg-muted/50">
            <TabsTrigger value="users" className="gap-2 py-3 data-[state=active]:bg-background">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">用户管理</span>
            </TabsTrigger>
            <TabsTrigger value="trades" className="gap-2 py-3 data-[state=active]:bg-background relative">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">交易控制</span>
              <NotificationBadge count={pendingCounts.trades} />
            </TabsTrigger>
            <TabsTrigger value="applications" className="gap-2 py-3 data-[state=active]:bg-background relative">
              <FileCheck className="w-4 h-4" />
              <span className="hidden sm:inline">申请审核</span>
              <NotificationBadge count={pendingCounts.applications} />
            </TabsTrigger>
            <TabsTrigger value="transactions" className="gap-2 py-3 data-[state=active]:bg-background">
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">交易记录</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2 py-3 data-[state=active]:bg-background">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">系统设置</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-6">
            <AdminUserList />
          </TabsContent>

          <TabsContent value="trades" className="mt-6">
            <AdminSmartTrades />
          </TabsContent>

          <TabsContent value="applications" className="mt-6">
            <AdminApplications />
          </TabsContent>

          <TabsContent value="transactions" className="mt-6">
            <AdminTransactions />
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <AdminSettings />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
