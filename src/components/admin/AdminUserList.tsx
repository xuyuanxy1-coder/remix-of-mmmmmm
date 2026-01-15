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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Search,
  MoreVertical,
  DollarSign,
  Lock,
  Unlock,
  ChevronLeft,
  ChevronRight,
  History,
  User,
  Shield,
  Image,
  MapPin,
  Calendar,
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
  last_login_ip: string | null;
  last_login_at: string | null;
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

interface KYCRecord {
  id: string;
  real_name: string;
  id_type: string;
  id_number: string;
  status: string;
  front_image_url: string | null;
  back_image_url: string | null;
  selfie_url: string | null;
  reject_reason: string | null;
  created_at: string;
  updated_at: string;
  reviewed_at: string | null;
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
  const [userDetailModal, setUserDetailModal] = useState<{
    open: boolean;
    user: UserWithDetails | null;
    kycRecords: KYCRecord[];
  }>({
    open: false,
    user: null,
    kycRecords: [],
  });
  const [imageModal, setImageModal] = useState<{ open: boolean; src: string; title: string }>({
    open: false,
    src: '',
    title: '',
  });

  // Form states
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceReason, setBalanceReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTxLoading, setIsTxLoading] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

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
          last_login_ip: profile.last_login_ip || null,
          last_login_at: profile.last_login_at || null,
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

  const openUserDetails = async (user: UserWithDetails) => {
    setUserDetailModal({ open: true, user, kycRecords: [] });
    setIsDetailLoading(true);
    try {
      // Fetch all KYC records for this user (history)
      const { data: kycData, error } = await supabase
        .from('kyc_records')
        .select('*')
        .eq('user_id', user.user_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setUserDetailModal((prev) => ({ ...prev, kycRecords: kycData || [] }));
    } catch (err) {
      console.error('Error fetching KYC records:', err);
      toast.error('获取KYC记录失败');
    } finally {
      setIsDetailLoading(false);
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

  const getIdTypeName = (idType: string) => {
    const map: Record<string, string> = {
      passport: '护照',
      driver_license: '驾驶证',
      national_id: '身份证',
      other: '其他',
    };
    return map[idType] || idType;
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
                    <TableCell>
                      <Button
                        variant="link"
                        className="p-0 h-auto font-medium text-primary"
                        onClick={() => openUserDetails(user)}
                      >
                        {user.username || '-'}
                      </Button>
                    </TableCell>
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
                          <DropdownMenuItem onClick={() => openUserDetails(user)}>
                            <User className="w-4 h-4 mr-2" />
                            查看详情
                          </DropdownMenuItem>
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

      {/* User Details Modal */}
      <Dialog open={userDetailModal.open} onOpenChange={(open) => !open && setUserDetailModal({ open: false, user: null, kycRecords: [] })}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              用户详情 - {userDetailModal.user?.username || userDetailModal.user?.email || '未知用户'}
            </DialogTitle>
          </DialogHeader>
          
          {isDetailLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <Tabs defaultValue="info" className="flex-1 overflow-hidden flex flex-col">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="info">基本信息</TabsTrigger>
                <TabsTrigger value="kyc">KYC历史</TabsTrigger>
              </TabsList>
              
              <TabsContent value="info" className="flex-1 overflow-auto mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Info */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <User className="w-4 h-4" />
                        账户信息
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">用户ID:</span>
                        <span className="font-mono text-xs">{userDetailModal.user?.user_id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">用户名:</span>
                        <span>{userDetailModal.user?.username || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">邮箱:</span>
                        <span>{userDetailModal.user?.email || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">钱包地址:</span>
                        <span className="font-mono text-xs max-w-[200px] truncate">{userDetailModal.user?.wallet_address || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">账户状态:</span>
                        {getStatusBadge(userDetailModal.user?.is_frozen || null)}
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">KYC状态:</span>
                        {getKycBadge(userDetailModal.user?.kycStatus || 'none')}
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">余额:</span>
                        <span className="font-medium">{userDetailModal.user?.balance.toLocaleString()} USDT</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">注册时间:</span>
                        <span>{userDetailModal.user?.created_at ? format(new Date(userDetailModal.user.created_at), 'yyyy-MM-dd HH:mm') : '-'}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Login Info */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        登录信息
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">最后登录IP:</span>
                        <span className="font-mono">{userDetailModal.user?.last_login_ip || '暂无记录'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">最后登录时间:</span>
                        <span>
                          {userDetailModal.user?.last_login_at
                            ? format(new Date(userDetailModal.user.last_login_at), 'yyyy-MM-dd HH:mm:ss')
                            : '暂无记录'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Loan Info */}
                  <Card className="md:col-span-2">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        贷款情况
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-3 bg-muted/50 rounded-lg">
                          <p className="text-2xl font-bold text-blue-500">{userDetailModal.user?.loanSummary.activeCount || 0}</p>
                          <p className="text-xs text-muted-foreground">进行中贷款</p>
                        </div>
                        <div className="text-center p-3 bg-muted/50 rounded-lg">
                          <p className="text-2xl font-bold text-yellow-500">{userDetailModal.user?.loanSummary.pendingCount || 0}</p>
                          <p className="text-xs text-muted-foreground">待审批</p>
                        </div>
                        <div className="text-center p-3 bg-muted/50 rounded-lg">
                          <p className="text-2xl font-bold text-red-500">{userDetailModal.user?.loanSummary.totalOwed?.toLocaleString() || 0}</p>
                          <p className="text-xs text-muted-foreground">欠款 (USDT)</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="kyc" className="flex-1 overflow-auto mt-4">
                {userDetailModal.kycRecords.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Shield className="w-12 h-12 mb-4 opacity-50" />
                    <p>该用户暂无KYC记录</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userDetailModal.kycRecords.map((kyc, index) => (
                      <Card key={kyc.id}>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center justify-between">
                            <span className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              KYC记录 #{userDetailModal.kycRecords.length - index}
                            </span>
                            {getKycBadge(kyc.status)}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* KYC Details */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">真实姓名</p>
                              <p className="font-medium">{kyc.real_name}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">证件类型</p>
                              <p className="font-medium">{getIdTypeName(kyc.id_type)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">证件号码</p>
                              <p className="font-medium font-mono">{kyc.id_number}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">提交时间</p>
                              <p className="font-medium">{format(new Date(kyc.created_at), 'yyyy-MM-dd HH:mm')}</p>
                            </div>
                          </div>
                          
                          {kyc.reject_reason && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                              <p className="text-sm text-red-500">
                                <strong>拒绝原因:</strong> {kyc.reject_reason}
                              </p>
                            </div>
                          )}

                          {/* KYC Photos */}
                          <div>
                            <p className="text-sm font-medium mb-2 flex items-center gap-2">
                              <Image className="w-4 h-4" />
                              KYC照片
                            </p>
                            <div className="grid grid-cols-3 gap-4">
                              {kyc.front_image_url && (
                                <div 
                                  className="cursor-pointer group"
                                  onClick={() => setImageModal({ open: true, src: kyc.front_image_url!, title: '证件正面' })}
                                >
                                  <p className="text-xs text-muted-foreground mb-1">证件正面</p>
                                  <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                                    <img 
                                      src={kyc.front_image_url} 
                                      alt="证件正面"
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                      <span className="text-white opacity-0 group-hover:opacity-100 text-xs">点击放大</span>
                                    </div>
                                  </div>
                                </div>
                              )}
                              {kyc.back_image_url && (
                                <div 
                                  className="cursor-pointer group"
                                  onClick={() => setImageModal({ open: true, src: kyc.back_image_url!, title: '证件背面' })}
                                >
                                  <p className="text-xs text-muted-foreground mb-1">证件背面</p>
                                  <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                                    <img 
                                      src={kyc.back_image_url} 
                                      alt="证件背面"
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                      <span className="text-white opacity-0 group-hover:opacity-100 text-xs">点击放大</span>
                                    </div>
                                  </div>
                                </div>
                              )}
                              {kyc.selfie_url && (
                                <div 
                                  className="cursor-pointer group"
                                  onClick={() => setImageModal({ open: true, src: kyc.selfie_url!, title: '自拍照' })}
                                >
                                  <p className="text-xs text-muted-foreground mb-1">自拍照</p>
                                  <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                                    <img 
                                      src={kyc.selfie_url} 
                                      alt="自拍照"
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                      <span className="text-white opacity-0 group-hover:opacity-100 text-xs">点击放大</span>
                                    </div>
                                  </div>
                                </div>
                              )}
                              {!kyc.front_image_url && !kyc.back_image_url && !kyc.selfie_url && (
                                <p className="text-sm text-muted-foreground col-span-3">暂无照片</p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setUserDetailModal({ open: false, user: null, kycRecords: [] })}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Preview Modal */}
      <Dialog open={imageModal.open} onOpenChange={(open) => !open && setImageModal({ open: false, src: '', title: '' })}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{imageModal.title}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-4">
            <img 
              src={imageModal.src} 
              alt={imageModal.title}
              className="max-w-full max-h-[70vh] object-contain rounded-lg"
            />
          </div>
        </DialogContent>
      </Dialog>

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
