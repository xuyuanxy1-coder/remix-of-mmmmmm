import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Check, 
  X, 
  Search, 
  RefreshCw, 
  Loader2,
  Eye,
  TrendingUp,
  Clock
} from 'lucide-react';

interface MiningInvestment {
  id: string;
  user_id: string;
  amount: number;
  tier: number;
  daily_rate: number;
  lock_days: number;
  start_date: string | null;
  end_date: string | null;
  status: string;
  total_earnings: number;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
  user_email?: string;
  user_name?: string;
}

const AdminMining = () => {
  const [investments, setInvestments] = useState<MiningInvestment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Action modal
  const [actionModal, setActionModal] = useState<{
    open: boolean;
    type: 'approve' | 'reject' | 'view' | null;
    investment: MiningInvestment | null;
  }>({ open: false, type: null, investment: null });
  const [adminNote, setAdminNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchInvestments = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('mining_investments')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch user emails for each investment
      const investmentsWithUsers = await Promise.all(
        (data || []).map(async (inv) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, username')
            .eq('user_id', inv.user_id)
            .single();
          
          return {
            ...inv,
            user_email: profile?.email || 'Unknown',
            user_name: profile?.username || 'Unknown',
          };
        })
      );

      setInvestments(investmentsWithUsers);
    } catch (error) {
      console.error('Failed to fetch mining investments:', error);
      toast.error('Failed to load mining data');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchInvestments();
  }, [fetchInvestments]);

  const handleApprove = async () => {
    if (!actionModal.investment) return;
    
    setIsProcessing(true);
    try {
      const now = new Date();
      const endDate = new Date(now.getTime() + actionModal.investment.lock_days * 24 * 60 * 60 * 1000);

      // Update investment status
      const { error: updateError } = await supabase
        .from('mining_investments')
        .update({
          status: 'active',
          start_date: now.toISOString(),
          end_date: endDate.toISOString(),
          admin_note: adminNote || null,
          updated_at: now.toISOString(),
        })
        .eq('id', actionModal.investment.id);

      if (updateError) throw updateError;

      // Deduct amount from user's balance
      const { data: asset } = await supabase
        .from('assets')
        .select('balance')
        .eq('user_id', actionModal.investment.user_id)
        .eq('currency', 'USDT')
        .single();

      if (asset) {
        const newBalance = Number(asset.balance) - actionModal.investment.amount;
        await supabase
          .from('assets')
          .update({ balance: newBalance, updated_at: now.toISOString() })
          .eq('user_id', actionModal.investment.user_id)
          .eq('currency', 'USDT');
      }

      toast.success('Mining application approved');
      setActionModal({ open: false, type: null, investment: null });
      setAdminNote('');
      fetchInvestments();
    } catch (error) {
      console.error('Approve error:', error);
      toast.error('Failed to approve application');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!actionModal.investment) return;
    
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('mining_investments')
        .update({
          status: 'rejected',
          admin_note: adminNote || 'Application rejected',
          updated_at: new Date().toISOString(),
        })
        .eq('id', actionModal.investment.id);

      if (error) throw error;

      toast.success('Mining application rejected');
      setActionModal({ open: false, type: null, investment: null });
      setAdminNote('');
      fetchInvestments();
    } catch (error) {
      console.error('Reject error:', error);
      toast.error('Failed to reject application');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSettle = async (investment: MiningInvestment) => {
    try {
      const { data, error } = await supabase.rpc('settle_mining_investment', {
        p_investment_id: investment.id,
      });

      if (error) throw error;

      if (data) {
        toast.success('Mining investment settled successfully');
        fetchInvestments();
      } else {
        toast.error('Investment not ready for settlement');
      }
    } catch (error) {
      console.error('Settlement error:', error);
      toast.error('Failed to settle investment');
    }
  };

  const filteredInvestments = investments.filter(inv => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      inv.user_email?.toLowerCase().includes(search) ||
      inv.user_name?.toLowerCase().includes(search) ||
      inv.id.toLowerCase().includes(search)
    );
  });

  const getStatusBadge = (status: string) => {
    const config: Record<string, string> = {
      pending: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400',
      active: 'bg-green-500/20 text-green-600 dark:text-green-400',
      completed: 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
      settled: 'bg-purple-500/20 text-purple-600 dark:text-purple-400',
      rejected: 'bg-red-500/20 text-red-600 dark:text-red-400',
    };
    return config[status] || 'bg-muted';
  };

  const calculateEarnings = (investment: MiningInvestment) => {
    if (investment.status !== 'active' || !investment.start_date) return 0;
    const now = new Date();
    const start = new Date(investment.start_date);
    const daysElapsed = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const actualDays = Math.min(daysElapsed, investment.lock_days);
    return investment.amount * (investment.daily_rate / 100) * actualDays;
  };

  const isMatured = (investment: MiningInvestment) => {
    if (!investment.end_date || investment.status !== 'active') return false;
    return new Date() >= new Date(investment.end_date);
  };

  // Calculate summary stats
  const totalPending = investments.filter(i => i.status === 'pending').length;
  const totalActive = investments.filter(i => i.status === 'active').length;
  const totalLocked = investments
    .filter(i => i.status === 'active')
    .reduce((sum, i) => sum + i.amount, 0);
  const totalEarnings = investments
    .filter(i => i.status === 'active')
    .reduce((sum, i) => sum + calculateEarnings(i), 0);

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
          <p className="text-sm text-muted-foreground">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{totalPending}</p>
        </div>
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
          <p className="text-sm text-muted-foreground">Active</p>
          <p className="text-2xl font-bold text-green-600">{totalActive}</p>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
          <p className="text-sm text-muted-foreground">Total Locked</p>
          <p className="text-2xl font-bold text-blue-600">{totalLocked.toLocaleString()} USDT</p>
        </div>
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
          <p className="text-sm text-muted-foreground">Total Earnings</p>
          <p className="text-2xl font-bold text-purple-600">+{totalEarnings.toFixed(2)} USDT</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by email, username, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="settled">Settled</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={fetchInvestments}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Daily Rate</TableHead>
              <TableHead>Lock Days</TableHead>
              <TableHead>Earnings</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : filteredInvestments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No mining investments found
                </TableCell>
              </TableRow>
            ) : (
              filteredInvestments.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{inv.user_name}</p>
                      <p className="text-xs text-muted-foreground">{inv.user_email}</p>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {inv.amount.toLocaleString()} USDT
                  </TableCell>
                  <TableCell>Tier {inv.tier}</TableCell>
                  <TableCell>{inv.daily_rate}%</TableCell>
                  <TableCell>{inv.lock_days} days</TableCell>
                  <TableCell>
                    {inv.status === 'active' ? (
                      <span className="text-green-500">
                        +{calculateEarnings(inv).toFixed(2)} USDT
                      </span>
                    ) : inv.status === 'settled' ? (
                      <span className="text-purple-500">
                        +{inv.total_earnings} USDT
                      </span>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(inv.status)}`}>
                      {inv.status}
                    </span>
                    {isMatured(inv) && (
                      <span className="ml-1 px-1.5 py-0.5 bg-orange-500/20 text-orange-600 text-xs rounded">
                        Matured
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(inv.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setActionModal({ open: true, type: 'view', investment: inv })}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {inv.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-green-500 hover:text-green-600"
                            onClick={() => setActionModal({ open: true, type: 'approve', investment: inv })}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-500 hover:text-red-600"
                            onClick={() => setActionModal({ open: true, type: 'reject', investment: inv })}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      {inv.status === 'active' && isMatured(inv) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSettle(inv)}
                        >
                          <TrendingUp className="w-4 h-4 mr-1" />
                          Settle
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Action Modal */}
      <Dialog open={actionModal.open} onOpenChange={(open) => {
        if (!open) {
          setActionModal({ open: false, type: null, investment: null });
          setAdminNote('');
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionModal.type === 'approve' && 'Approve Mining Application'}
              {actionModal.type === 'reject' && 'Reject Mining Application'}
              {actionModal.type === 'view' && 'Mining Investment Details'}
            </DialogTitle>
            <DialogDescription>
              {actionModal.type === 'approve' && 'This will deduct the amount from user balance and start mining.'}
              {actionModal.type === 'reject' && 'Provide a reason for rejection.'}
            </DialogDescription>
          </DialogHeader>

          {actionModal.investment && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">User</p>
                  <p className="font-medium">{actionModal.investment.user_name}</p>
                  <p className="text-xs text-muted-foreground">{actionModal.investment.user_email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="font-medium">{actionModal.investment.amount.toLocaleString()} USDT</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tier & Duration</p>
                  <p className="font-medium">Tier {actionModal.investment.tier} • {actionModal.investment.lock_days} days</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Daily Rate</p>
                  <p className="font-medium text-green-500">{actionModal.investment.daily_rate}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Expected Earnings</p>
                  <p className="font-medium text-green-500">
                    +{(actionModal.investment.amount * (actionModal.investment.daily_rate / 100) * actionModal.investment.lock_days).toFixed(2)} USDT
                  </p>
                </div>
                {actionModal.investment.start_date && (
                  <div>
                    <p className="text-sm text-muted-foreground">Start Date</p>
                    <p className="font-medium">{new Date(actionModal.investment.start_date).toLocaleDateString()}</p>
                  </div>
                )}
                {actionModal.investment.end_date && (
                  <div>
                    <p className="text-sm text-muted-foreground">End Date</p>
                    <p className="font-medium">{new Date(actionModal.investment.end_date).toLocaleDateString()}</p>
                  </div>
                )}
              </div>

              {(actionModal.type === 'approve' || actionModal.type === 'reject') && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Admin Note</p>
                  <Textarea
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder={actionModal.type === 'reject' ? 'Reason for rejection...' : 'Optional note...'}
                    rows={3}
                  />
                </div>
              )}

              {actionModal.investment.admin_note && actionModal.type === 'view' && (
                <div>
                  <p className="text-sm text-muted-foreground">Admin Note</p>
                  <p className="text-sm">{actionModal.investment.admin_note}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActionModal({ open: false, type: null, investment: null })}
            >
              Close
            </Button>
            {actionModal.type === 'approve' && (
              <Button onClick={handleApprove} disabled={isProcessing}>
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Approve
              </Button>
            )}
            {actionModal.type === 'reject' && (
              <Button variant="destructive" onClick={handleReject} disabled={isProcessing}>
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Reject
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminMining;
