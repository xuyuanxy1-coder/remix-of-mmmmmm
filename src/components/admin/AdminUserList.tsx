import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Search, MoreVertical, DollarSign, Lock, Unlock, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

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
}

const AdminUserList = () => {
  const [users, setUsers] = useState<UserWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

  // Modal states
  const [balanceModal, setBalanceModal] = useState<{ open: boolean; user: UserWithDetails | null }>({ open: false, user: null });
  const [freezeConfirm, setFreezeConfirm] = useState<{ open: boolean; user: UserWithDetails | null }>({ open: false, user: null });

  // Form states
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceReason, setBalanceReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      // Get profiles with search filter - also search by user_id for new users
      let query = supabase
        .from('profiles')
        .select('*', { count: 'exact' });

      if (search) {
        query = query.or(`username.ilike.%${search}%,email.ilike.%${search}%,user_id.ilike.%${search}%`);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      const { data: profiles, error: profilesError, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (profilesError) throw profilesError;

      // Get assets for each user
      const userIds = profiles?.map(p => p.user_id) || [];
      
      let assets: any[] = [];
      let kycRecords: any[] = [];
      
      if (userIds.length > 0) {
        const { data: assetsData } = await supabase
          .from('assets')
          .select('*')
          .in('user_id', userIds)
          .eq('currency', 'USDT');
        assets = assetsData || [];

        // Get KYC status for each user
        const { data: kycData } = await supabase
          .from('kyc_records')
          .select('user_id, status')
          .in('user_id', userIds);
        kycRecords = kycData || [];
      }

      // Combine data
      const usersWithDetails: UserWithDetails[] = (profiles || []).map(profile => {
        const userAsset = assets?.find(a => a.user_id === profile.user_id);
        const kycRecord = kycRecords?.find(k => k.user_id === profile.user_id);
        
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
        };
      });

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
  }, [page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const totalPages = Math.ceil(totalCount / pageSize);

  const handleBalanceSubmit = async () => {
    if (!balanceModal.user || !balanceAmount) return;
    
    setIsSubmitting(true);
    try {
      const amount = parseFloat(balanceAmount);
      
      // Get current balance
      const { data: currentAsset } = await supabase
        .from('assets')
        .select('balance')
        .eq('user_id', balanceModal.user.user_id)
        .eq('currency', 'USDT')
        .single();

      const currentBalance = currentAsset?.balance || 0;
      const newBalance = currentBalance + amount;

      // Update balance
      const { error } = await supabase
        .from('assets')
        .update({ balance: newBalance })
        .eq('user_id', balanceModal.user.user_id)
        .eq('currency', 'USDT');

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
    return !isFrozen 
      ? <Badge className="bg-green-500/20 text-green-500">正常</Badge>
      : <Badge className="bg-red-500/20 text-red-500">已冻结</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>用户管理</span>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="搜索用户..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
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
                <TableHead>余额</TableHead>
                <TableHead>实名认证</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>注册时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      加载中...
                    </div>
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    暂无用户
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.username || '-'}</TableCell>
                    <TableCell className="text-sm">{user.email || '-'}</TableCell>
                    <TableCell>{user.balance.toLocaleString()} USDT</TableCell>
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
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              第 {page} 页 / 共 {totalPages} 页
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
            >
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
              <label className="text-sm font-medium">金额 (USDT)</label>
              <Input
                type="number"
                placeholder="例如: 100 为充值, -50 为扣除"
                value={balanceAmount}
                onChange={(e) => setBalanceAmount(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                正数 = 充值，负数 = 扣除
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">原因</label>
              <Textarea
                placeholder="请输入修改余额的原因"
                value={balanceReason}
                onChange={(e) => setBalanceReason(e.target.value)}
              />
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
            <DialogTitle>
              {!freezeConfirm.user?.is_frozen ? '冻结' : '解冻'}账户
            </DialogTitle>
          </DialogHeader>
          <p className="py-4">
            确定要{!freezeConfirm.user?.is_frozen ? '冻结' : '解冻'} <strong>{freezeConfirm.user?.username || freezeConfirm.user?.email}</strong> 的账户吗？
            {!freezeConfirm.user?.is_frozen && (
              <span className="block text-sm text-muted-foreground mt-2">
                冻结后该账户将无法进行交易和提现操作。
              </span>
            )}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFreezeConfirm({ open: false, user: null })}>
              取消
            </Button>
            <Button 
              variant={!freezeConfirm.user?.is_frozen ? 'destructive' : 'default'}
              onClick={handleFreezeToggle} 
              disabled={isSubmitting}
            >
              {isSubmitting ? '处理中...' : (!freezeConfirm.user?.is_frozen ? '确认冻结' : '确认解冻')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default AdminUserList;
