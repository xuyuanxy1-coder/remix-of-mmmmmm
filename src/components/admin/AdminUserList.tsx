import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  Search,
  MoreVertical,
  DollarSign,
  Lock,
  Unlock,
  ChevronLeft,
  ChevronRight,
  FileText,
  History,
  X,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface LoanSummary {
  activeCount: number;
  totalOwed: number;
  pendingCount: number;
}

interface UserWithDetails {
  id: string;
  user_id: string;
  username: string | null;
  email: string | null;
  wallet_address: string | null;
  is_frozen: boolean | null;
  created_at: string;
  balance: number;
  kycStatus: 'pending' | 'approved' | 'rejected' | 'none';
  loanSummary: LoanSummary;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  note: string | null;
  created_at: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const AdminUserList = () => {
  // Data states
  const [users, setUsers] = useState<UserWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

  // Search & filter
  const [searchText, setSearchText] = useState('');
  const [kycFilter, setKycFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loanFilter, setLoanFilter] = useState<string>('all');

  // Modal states
  const [balanceModal, setBalanceModal] = useState<{ open: boolean; user: UserWithDetails | null }>({
    open: false,
    user: null,
  });
  const [freezeConfirm, setFreezeConfirm] = useState<{ open: boolean; user: UserWithDetails | null }>({
    open: false,
    user: null,
  });
  const [txModal, setTxModal] = useState<{ open: boolean; user: UserWithDetails | null; transactions: Transaction[] }>({
    open: false,
    user: null,
    transactions: [],
  });

  // Form states
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceReason, setBalanceReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTxLoading, setIsTxLoading] = useState(false);

  // ─────────────────────────────────────────────────────────────────────────────
  // Data fetching
  // ─────────────────────────────────────────────────────────────────────────────

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      // Build query
      let query = supabase.from('profiles').select('*', { count: 'exact' });

      // Text search
      if (searchText) {
        query = query.or(
          `username.ilike.%${searchText}%,email.ilike.%${searchText}%,wallet_address.ilike.%${searchText}%,user_id.ilike.%${searchText}%`
        );
      }

      // Status filter
      if (statusFilter === 'frozen') {
        query = query.eq('is_frozen', true);
      } else if (statusFilter === 'active') {
        query = query.or('is_frozen.is.null,is_frozen.eq.false');
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data: profiles, error: profilesError, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (profilesError) throw profilesError;

      const userIds = profiles?.map((p) => p.user_id) || [];

      let assets: any[] = [];
      let kycRecords: any[] = [];
      let loans: any[] = [];
      let repayments: any[] = [];

      if (userIds.length > 0) {
        // Fetch assets
        const { data: assetsData } = await supabase
          .from('assets')
          .select('*')
          .in('user_id', userIds)
          .eq('currency', 'USDT');
        assets = assetsData || [];

        // Fetch KYC
        const { data: kycData } = await supabase
          .from('kyc_records')
          .select('user_id, status')
          .in('user_id', userIds);
        kycRecords = kycData || [];

        // Fetch loans
        const { data: loansData } = await supabase
          .from('loans')
          .select('id, user_id, amount, status, created_at')
          .in('user_id', userIds);
        loans = loansData || [];

        // Fetch repayments for active loans
        const loanIds = loans.map((l) => l.id);
        if (loanIds.length > 0) {
          const { data: repData } = await supabase
            .from('loan_repayments')
            .select('loan_id, amount, status')
            .in('loan_id', loanIds)
            .eq('status', 'approved');
          repayments = repData || [];
        }
      }

      // Aggregate repayments per loan
      const repaidByLoan: Record<string, number> = {};
      repayments.forEach((r) => {
        repaidByLoan[r.loan_id] = (repaidByLoan[r.loan_id] || 0) + Number(r.amount);
      });

      // Build user objects
      let usersWithDetails: UserWithDetails[] = (profiles || []).map((profile) => {
        const userAsset = assets.find((a) => a.user_id === profile.user_id);
        const kycRecord = kycRecords.find((k) => k.user_id === profile.user_id);
        const userLoans = loans.filter((l) => l.user_id === profile.user_id);

        // Loan summary
        const activeLoans = userLoans.filter((l) => l.status === 'approved' || l.status === 'overdue');
        const pendingLoans = userLoans.filter((l) => l.status === 'pending');
        let totalOwed = 0;
        activeLoans.forEach((l) => {
          const repaid = repaidByLoan[l.id] || 0;
          totalOwed += Math.max(0, Number(l.amount) - repaid);
        });

        return {
          id: profile.id,
          user_id: profile.user_id,
          username: profile.username,
          email: profile.email,
          wallet_address: profile.wallet_address,
          is_frozen: profile.is_frozen,
          created_at: profile.created_at,
          balance: userAsset?.balance || 0,
          kycStatus: (kycRecord?.status as 'pending' | 'approved' | 'rejected') || 'none',
          loanSummary: {
            activeCount: activeLoans.length,
            totalOwed,
            pendingCount: pendingLoans.length,
          },
        };
      });

      // Client-side KYC filter
      if (kycFilter !== 'all') {
        usersWithDetails = usersWithDetails.filter((u) => u.kycStatus === kycFilter);
      }

      // Client-side loan filter
      if (loanFilter === 'hasLoan') {
        usersWithDetails = usersWithDetails.filter((u) => u.loanSummary.activeCount > 0);
      } else if (loanFilter === 'noLoan') {
        usersWithDetails = usersWithDetails.filter((u) => u.loanSummary.activeCount === 0);
      } else if (loanFilter === 'pending') {
        usersWithDetails = usersWithDetails.filter((u) => u.loanSummary.pendingCount > 0);
      }

      setUsers(usersWithDetails);
      setTotalCount(count || 0);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast.error('获取用户列表失败');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchText, kycFilter, loanFilter]);

  const totalPages = Math.ceil(totalCount / pageSize);

  // ─────────────────────────────────────────────────────────────────────────────
  // Actions
  // ─────────────────────────────────────────────────────────────────────────────

  const handleBalanceSubmit = async () => {
    if (!balanceModal.user || !balanceAmount) return;

    setIsSubmitting(true);
    try {
      const amount = parseFloat(balanceAmount);

      const { data: currentAsset } = await supabase
        .from('assets')
        .select('balance')
        .eq('user_id', balanceModal.user.user_id)
        .eq('currency', 'USDT')
        .maybeSingle();

      const currentBalance = currentAsset?.balance || 0;
      const newBalance = currentBalance + amount;

      const { error } = await supabase
        .from('assets')
        .upsert(
          { user_id: balanceModal.user.user_id, currency: 'USDT', balance: newBalance },
          { onConflict: 'user_id,currency' }
        );

      if (error) throw error;

      // Record transaction
      await supabase.from('transactions').insert({
        user_id: balanceModal.user.user_id,
        type: amount >= 0 ? 'deposit' : 'withdraw',
        amount: Math.abs(amount),
        currency: 'USDT',
        status: 'completed',
        note: `管理员调整: ${balanceReason || '余额调整'}`,
      });

      toast.success('余额修改成功');
      setBalanceModal({ open: false, user: null });
      setBalanceAmount('');
      setBalanceReason('');
      fetchUsers();
    } catch (error: any) {
      console.error('Error updating balance:', error);
      toast.error('余额修改失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFreezeToggle = async () => {
    if (!freezeConfirm.user) return;

    setIsSubmitting(true);
    try {
      const newFrozenStatus = !freezeConfirm.user.is_frozen;

      const { error } = await supabase
        .from('profiles')
        .update({ is_frozen: newFrozenStatus })
        .eq('user_id', freezeConfirm.user.user_id);

      if (error) throw error;

      toast.success(`账户${newFrozenStatus ? '冻结' : '解冻'}成功`);
      setFreezeConfirm({ open: false, user: null });
      fetchUsers();
    } catch (error: any) {
      console.error('Error toggling freeze:', error);
      toast.error('操作失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openTransactionHistory = async (user: UserWithDetails) => {
    setTxModal({ open: true, user, transactions: [] });
    setIsTxLoading(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.user_id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      setTxModal((prev) => ({ ...prev, transactions: data || [] }));
    } catch (err) {
      console.error('Error fetching transactions:', err);
      toast.error('获取资金明细失败');
    } finally {
      setIsTxLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────────────

  const getKycBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500/20 text-green-500">已认证</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-500">待审核</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/20 text-red-500">已拒绝</Badge>;
      default:
        return <Badge variant="outline">未提交</Badge>;
    }
  };

  const getStatusBadge = (isFrozen: boolean | null) => {
    return !isFrozen ? (
      <Badge className="bg-green-500/20 text-green-500">正常</Badge>
    ) : (
      <Badge className="bg-red-500/20 text-red-500">已冻结</Badge>
    );
  };

  const getLoanBadge = (summary: LoanSummary) => {
    if (summary.activeCount === 0 && summary.pendingCount === 0) {
      return <Badge variant="outline">无贷款</Badge>;
    }
    if (summary.pendingCount > 0 && summary.activeCount === 0) {
      return <Badge className="bg-yellow-500/20 text-yellow-500">{summary.pendingCount} 待审批</Badge>;
    }
    return (
      <div className="flex flex-col gap-1 text-xs">
        <Badge className="bg-blue-500/20 text-blue-500">{summary.activeCount} 笔进行中</Badge>
        <span className="text-muted-foreground">欠款: {summary.totalOwed.toLocaleString()} USDT</span>
      </div>
    );
  };

  const getTxTypeBadge = (type: string) => {
    const map: Record<string, { label: string; color: string }> = {
      deposit: { label: '充值', color: 'bg-green-500/20 text-green-500' },
      withdraw: { label: '提现', color: 'bg-red-500/20 text-red-500' },
      trade: { label: '交易', color: 'bg-blue-500/20 text-blue-500' },
      loan: { label: '贷款', color: 'bg-purple-500/20 text-purple-500' },
      repayment: { label: '还款', color: 'bg-teal-500/20 text-teal-500' },
      transfer: { label: '转账', color: 'bg-orange-500/20 text-orange-500' },
    };
    const info = map[type] || { label: type, color: '' };
    return <Badge className={info.color}>{info.label}</Badge>;
  };

  const getTxStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500/20 text-green-500">已完成</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-500">待处理</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/20 text-red-500">失败</Badge>;
      case 'cancelled':
        return <Badge variant="outline">已取消</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <span>用户管理</span>

          {/* Search & Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Text search */}
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="用户名/邮箱/钱包/ID..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* KYC filter */}
            <Select value={kycFilter} onValueChange={setKycFilter}>
              <SelectTrigger className="w-28">
                <SelectValue placeholder="KYC" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部KYC</SelectItem>
                <SelectItem value="approved">已认证</SelectItem>
                <SelectItem value="pending">待审核</SelectItem>
                <SelectItem value="rejected">已拒绝</SelectItem>
                <SelectItem value="none">未提交</SelectItem>
              </SelectContent>
            </Select>

            {/* Status filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-28">
                <SelectValue placeholder="状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="active">正常</SelectItem>
                <SelectItem value="frozen">已冻结</SelectItem>
              </SelectContent>
            </Select>

            {/* Loan filter */}
            <Select value={loanFilter} onValueChange={setLoanFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="贷款" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部贷款</SelectItem>
                <SelectItem value="hasLoan">有进行中贷款</SelectItem>
                <SelectItem value="pending">有待审批贷款</SelectItem>
                <SelectItem value="noLoan">无贷款</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>用户名</TableHead>
                <TableHead>邮箱</TableHead>
                <TableHead>余额 (USDT)</TableHead>
                <TableHead>贷款情况</TableHead>
                <TableHead>实名认证</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>注册时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      加载中...
                    </div>
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    暂无用户
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.username || '-'}</TableCell>
                    <TableCell className="text-sm">{user.email || '-'}</TableCell>
                    <TableCell>{user.balance.toLocaleString()}</TableCell>
                    <TableCell>{getLoanBadge(user.loanSummary)}</TableCell>
                    <TableCell>{getKycBadge(user.kycStatus)}</TableCell>
                    <TableCell>{getStatusBadge(user.is_frozen)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(user.created_at), 'yyyy-MM-dd HH:mm')}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover border border-border">
                          <DropdownMenuItem onClick={() => setBalanceModal({ open: true, user })}>
                            <DollarSign className="w-4 h-4 mr-2" />
                            修改余额
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openTransactionHistory(user)}>
                            <History className="w-4 h-4 mr-2" />
                            资金明细
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setFreezeConfirm({ open: true, user })}>
                            {!user.is_frozen ? (
                              <>
                                <Lock className="w-4 h-4 mr-2" />
                                冻结账户
                              </>
                            ) : (
                              <>
                                <Unlock className="w-4 h-4 mr-2" />
                                解冻账户
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              第 {page} 页 / 共 {totalPages} 页
            </span>
            <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </CardContent>

      {/* Balance Modal */}
      <Dialog open={balanceModal.open} onOpenChange={(open) => !open && setBalanceModal({ open: false, user: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>修改余额 - {balanceModal.user?.username || balanceModal.user?.email}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>金额 (USDT)</Label>
              <Input
                type="number"
                placeholder="例如: 100 为充值, -50 为扣除"
                value={balanceAmount}
                onChange={(e) => setBalanceAmount(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">正数 = 充值，负数 = 扣除</p>
            </div>
            <div className="space-y-2">
              <Label>原因</Label>
              <Textarea placeholder="请输入修改余额的原因" value={balanceReason} onChange={(e) => setBalanceReason(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBalanceModal({ open: false, user: null })}>
              取消
            </Button>
            <Button onClick={handleBalanceSubmit} disabled={isSubmitting || !balanceAmount}>
              {isSubmitting ? '处理中...' : '确认修改'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Freeze Confirm Modal */}
      <Dialog open={freezeConfirm.open} onOpenChange={(open) => !open && setFreezeConfirm({ open: false, user: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{!freezeConfirm.user?.is_frozen ? '冻结' : '解冻'}账户</DialogTitle>
          </DialogHeader>
          <p className="py-4">
            确定要{!freezeConfirm.user?.is_frozen ? '冻结' : '解冻'}{' '}
            <strong>{freezeConfirm.user?.username || freezeConfirm.user?.email}</strong> 的账户吗？
            {!freezeConfirm.user?.is_frozen && (
              <span className="block text-sm text-muted-foreground mt-2">冻结后该账户将无法进行交易和提现操作。</span>
            )}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFreezeConfirm({ open: false, user: null })}>
              取消
            </Button>
            <Button variant={!freezeConfirm.user?.is_frozen ? 'destructive' : 'default'} onClick={handleFreezeToggle} disabled={isSubmitting}>
              {isSubmitting ? '处理中...' : !freezeConfirm.user?.is_frozen ? '确认冻结' : '确认解冻'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transaction History Modal */}
      <Dialog open={txModal.open} onOpenChange={(open) => !open && setTxModal({ open: false, user: null, transactions: [] })}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>资金明细 - {txModal.user?.username || txModal.user?.email}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[400px] pr-4">
            {isTxLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : txModal.transactions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">暂无交易记录</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>时间</TableHead>
                    <TableHead>类型</TableHead>
                    <TableHead>金额</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>备注</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {txModal.transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="text-xs">{format(new Date(tx.created_at), 'yyyy-MM-dd HH:mm')}</TableCell>
                      <TableCell>{getTxTypeBadge(tx.type)}</TableCell>
                      <TableCell>
                        <span className={tx.type === 'deposit' || tx.type === 'loan' ? 'text-green-500' : 'text-red-500'}>
                          {tx.type === 'deposit' || tx.type === 'loan' ? '+' : '-'}
                          {Number(tx.amount).toLocaleString()} {tx.currency}
                        </span>
                      </TableCell>
                      <TableCell>{getTxStatusBadge(tx.status)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{tx.note || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTxModal({ open: false, user: null, transactions: [] })}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default AdminUserList;
