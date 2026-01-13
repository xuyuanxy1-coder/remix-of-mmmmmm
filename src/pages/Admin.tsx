import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Users, FileCheck, History, Settings, LogOut, Shield } from 'lucide-react';
import { toast } from 'sonner';
import AdminUserList from '@/components/admin/AdminUserList';
import AdminApplications from '@/components/admin/AdminApplications';
import AdminTransactions from '@/components/admin/AdminTransactions';
import AdminSettings from '@/components/admin/AdminSettings';

const Admin = () => {
  const { user, isAdmin, logout, checkAuth } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');

  useEffect(() => {
    const verifyAdmin = async () => {
      const isAuthed = await checkAuth();
      
      if (!isAuthed) {
        toast.error('Please login first');
        navigate('/auth');
        return;
      }

      // Check stored user role
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.role !== 'admin') {
          toast.error('Access denied. Admin only.');
          navigate('/auth');
          return;
        }
      } else if (!isAdmin) {
        toast.error('Access denied. Admin only.');
        navigate('/auth');
        return;
      }

      setIsLoading(false);
    };

    verifyAdmin();
  }, [navigate, isAdmin, checkAuth]);

  const handleLogout = () => {
    logout();
    navigate('/auth');
    toast.success('Logged out successfully');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
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
                <h1 className="font-display font-bold text-lg">Admin Dashboard</h1>
                <p className="text-xs text-muted-foreground">Welcome, {user?.username}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="w-full grid grid-cols-4 h-auto p-1 bg-muted/50">
            <TabsTrigger value="users" className="gap-2 py-3 data-[state=active]:bg-background">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="applications" className="gap-2 py-3 data-[state=active]:bg-background">
              <FileCheck className="w-4 h-4" />
              <span className="hidden sm:inline">Applications</span>
            </TabsTrigger>
            <TabsTrigger value="transactions" className="gap-2 py-3 data-[state=active]:bg-background">
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">Transactions</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2 py-3 data-[state=active]:bg-background">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-6">
            <AdminUserList />
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
