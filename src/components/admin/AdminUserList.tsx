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
import { Search, MoreVertical, DollarSign, Lock, Unlock, Key, Gamepad2, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { adminApi, AdminUser, PendingTrade } from '@/lib/adminApi';

const AdminUserList = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortField, setSortField] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modal states
  const [balanceModal, setBalanceModal] = useState<{ open: boolean; user: AdminUser | null }>({ open: false, user: null });
  const [passwordModal, setPasswordModal] = useState<{ open: boolean; user: AdminUser | null }>({ open: false, user: null });
  const [tradesModal, setTradesModal] = useState<{ open: boolean; user: AdminUser | null; trades: PendingTrade[] }>({ open: false, user: null, trades: [] });
  const [freezeConfirm, setFreezeConfirm] = useState<{ open: boolean; user: AdminUser | null }>({ open: false, user: null });

  // Form states
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceReason, setBalanceReason] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await adminApi.getUsers({
        search: search || undefined,
        page,
        limit: 10,
        sort: sortField,
        order: sortOrder,
      });
      setUsers(response.users);
      setTotalPages(response.totalPages);
    } catch (error: any) {
      toast.error(error.message || '获取用户列表失败');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, sortField, sortOrder]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleBalanceSubmit = async () => {
    if (!balanceModal.user || !balanceAmount) return;
    
    setIsSubmitting(true);
    try {
      await adminApi.updateUserBalance(balanceModal.user.id, {
        amount: parseFloat(balanceAmount),
        reason: balanceReason,
      });
      toast.success('余额修改成功');
      setBalanceModal({ open: false, user: null });
      setBalanceAmount('');
      setBalanceReason('');
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || '余额修改失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordSubmit = async () => {
    if (!passwordModal.user || !newPassword) return;
    
    setIsSubmitting(true);
    try {
      await adminApi.updateUserPassword(passwordModal.user.id, newPassword);
      toast.success('密码修改成功');
      setPasswordModal({ open: false, user: null });
      setNewPassword('');
    } catch (error: any) {
      toast.error(error.message || '密码修改失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFreezeToggle = async () => {
    if (!freezeConfirm.user) return;
    
    setIsSubmitting(true);
    try {
      const newStatus = freezeConfirm.user.status === 'active' ? 'frozen' : 'active';
      await adminApi.updateUserStatus(freezeConfirm.user.id, newStatus);
      toast.success(`账户${newStatus === 'frozen' ? '冻结' : '解冻'}成功`);
      setFreezeConfirm({ open: false, user: null });
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || '操作失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openTradesModal = async (user: AdminUser) => {
    try {
      const trades = await adminApi.getUserPendingTrades(user.id);
      setTradesModal({ open: true, user, trades });
    } catch (error: any) {
      toast.error(error.message || '获取待处理交易失败');
    }
  };

  const handleTradeOutcome = async (tradeId: string, outcome: 'win' | 'loss') => {
    setIsSubmitting(true);
    try {
      await adminApi.setTradeOutcome(tradeId, outcome);
      toast.success(`交易已设置为${outcome === 'win' ? '盈利' : '亏损'}`);
      // Refresh trades
      if (tradesModal.user) {
        const trades = await adminApi.getUserPendingTrades(tradesModal.user.id);
        setTradesModal({ ...tradesModal, trades });
      }
    } catch (error: any) {
      toast.error(error.message || '设置交易结果失败');
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

  const getStatusBadge = (status: string) => {
    return status === 'active' 
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
                <TableHead className="cursor-pointer" onClick={() => handleSort('username')}>
                  <div className="flex items-center gap-1">
                    用户名
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </TableHead>
                <TableHead>钱包地址</TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('balance')}>
                  <div className="flex items-center gap-1">
                    余额
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </TableHead>
                <TableHead>贷款</TableHead>
                <TableHead>盈/亏</TableHead>
                <TableHead>实名认证</TableHead>
                <TableHead>状态</TableHead>
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
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {user.walletAddress 
                        ? `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`
                        : '-'}
                    </TableCell>
                    <TableCell>{user.balance.toLocaleString()} USDT</TableCell>
                    <TableCell>{user.loanAmount.toLocaleString()} USDT</TableCell>
                    <TableCell>
                      <span className="text-green-500">+{user.totalWins}</span>
                      {' / '}
                      <span className="text-red-500">-{user.totalLosses}</span>
                    </TableCell>
                    <TableCell>{getKycBadge(user.kycStatus)}</TableCell>
                    <TableCell>{getStatusBadge(user.status)}</TableCell>
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
                            {user.status === 'active' ? (
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
                          <DropdownMenuItem onClick={() => setPasswordModal({ open: true, user })}>
                            <Key className="w-4 h-4 mr-2" />
                            修改密码
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openTradesModal(user)}>
                            <Gamepad2 className="w-4 h-4 mr-2" />
                            控制交易
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
            <DialogTitle>修改余额 - {balanceModal.user?.username}</DialogTitle>
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

      {/* Password Modal */}
      <Dialog open={passwordModal.open} onOpenChange={(open) => !open && setPasswordModal({ open: false, user: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>修改密码 - {passwordModal.user?.username}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">新密码</label>
              <Input
                type="password"
                placeholder="请输入新密码"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordModal({ open: false, user: null })}>
              取消
            </Button>
            <Button onClick={handlePasswordSubmit} disabled={isSubmitting || !newPassword}>
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
              {freezeConfirm.user?.status === 'active' ? '冻结' : '解冻'}账户
            </DialogTitle>
          </DialogHeader>
          <p className="py-4">
            确定要{freezeConfirm.user?.status === 'active' ? '冻结' : '解冻'} <strong>{freezeConfirm.user?.username}</strong> 的账户吗？
            {freezeConfirm.user?.status === 'active' && (
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
              variant={freezeConfirm.user?.status === 'active' ? 'destructive' : 'default'}
              onClick={handleFreezeToggle} 
              disabled={isSubmitting}
            >
              {isSubmitting ? '处理中...' : (freezeConfirm.user?.status === 'active' ? '确认冻结' : '确认解冻')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Trades Control Modal */}
      <Dialog open={tradesModal.open} onOpenChange={(open) => !open && setTradesModal({ open: false, user: null, trades: [] })}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>待处理交易 - {tradesModal.user?.username}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {tradesModal.trades.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">暂无待处理交易</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>交易对</TableHead>
                    <TableHead>方向</TableHead>
                    <TableHead>金额</TableHead>
                    <TableHead>时长</TableHead>
                    <TableHead>盈利率</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tradesModal.trades.map((trade) => (
                    <TableRow key={trade.id}>
                      <TableCell>{trade.pair}</TableCell>
                      <TableCell>
                        <Badge className={trade.side === 'long' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}>
                          {trade.side === 'long' ? '做多' : '做空'}
                        </Badge>
                      </TableCell>
                      <TableCell>{trade.amount} USDT</TableCell>
                      <TableCell>{trade.duration}秒</TableCell>
                      <TableCell>{(trade.profitRate * 100).toFixed(0)}%</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            className="bg-green-500 hover:bg-green-600"
                            onClick={() => handleTradeOutcome(trade.id, 'win')}
                            disabled={isSubmitting}
                          >
                            盈利
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleTradeOutcome(trade.id, 'loss')}
                            disabled={isSubmitting}
                          >
                            亏损
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default AdminUserList;
