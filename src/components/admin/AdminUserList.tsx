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
      toast.error(error.message || 'Failed to fetch users');
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
      toast.success('Balance updated successfully');
      setBalanceModal({ open: false, user: null });
      setBalanceAmount('');
      setBalanceReason('');
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update balance');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordSubmit = async () => {
    if (!passwordModal.user || !newPassword) return;
    
    setIsSubmitting(true);
    try {
      await adminApi.updateUserPassword(passwordModal.user.id, newPassword);
      toast.success('Password updated successfully');
      setPasswordModal({ open: false, user: null });
      setNewPassword('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update password');
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
      toast.success(`User ${newStatus === 'frozen' ? 'frozen' : 'unfrozen'} successfully`);
      setFreezeConfirm({ open: false, user: null });
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update user status');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openTradesModal = async (user: AdminUser) => {
    try {
      const trades = await adminApi.getUserPendingTrades(user.id);
      setTradesModal({ open: true, user, trades });
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch pending trades');
    }
  };

  const handleTradeOutcome = async (tradeId: string, outcome: 'win' | 'loss') => {
    setIsSubmitting(true);
    try {
      await adminApi.setTradeOutcome(tradeId, outcome);
      toast.success(`Trade set to ${outcome}`);
      // Refresh trades
      if (tradesModal.user) {
        const trades = await adminApi.getUserPendingTrades(tradesModal.user.id);
        setTradesModal({ ...tradesModal, trades });
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to set trade outcome');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getKycBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500/20 text-green-500">Verified</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-500">Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/20 text-red-500">Rejected</Badge>;
      default:
        return <Badge variant="outline">None</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    return status === 'active' 
      ? <Badge className="bg-green-500/20 text-green-500">Active</Badge>
      : <Badge className="bg-red-500/20 text-red-500">Frozen</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>User Management</span>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
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
                    Username
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </TableHead>
                <TableHead>Wallet</TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('balance')}>
                  <div className="flex items-center gap-1">
                    Balance
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </TableHead>
                <TableHead>Loan</TableHead>
                <TableHead>Win/Loss</TableHead>
                <TableHead>KYC</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      Loading...
                    </div>
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No users found
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
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setBalanceModal({ open: true, user })}>
                            <DollarSign className="w-4 h-4 mr-2" />
                            Modify Balance
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setFreezeConfirm({ open: true, user })}>
                            {user.status === 'active' ? (
                              <>
                                <Lock className="w-4 h-4 mr-2" />
                                Freeze Account
                              </>
                            ) : (
                              <>
                                <Unlock className="w-4 h-4 mr-2" />
                                Unfreeze Account
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setPasswordModal({ open: true, user })}>
                            <Key className="w-4 h-4 mr-2" />
                            Change Password
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openTradesModal(user)}>
                            <Gamepad2 className="w-4 h-4 mr-2" />
                            Control Trades
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
              Page {page} of {totalPages}
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
            <DialogTitle>Modify Balance - {balanceModal.user?.username}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount (USDT)</label>
              <Input
                type="number"
                placeholder="e.g., 100 for deposit, -50 for deduction"
                value={balanceAmount}
                onChange={(e) => setBalanceAmount(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Positive = deposit, Negative = deduction
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Reason</label>
              <Textarea
                placeholder="Enter reason for balance change"
                value={balanceReason}
                onChange={(e) => setBalanceReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBalanceModal({ open: false, user: null })}>
              Cancel
            </Button>
            <Button onClick={handleBalanceSubmit} disabled={isSubmitting || !balanceAmount}>
              {isSubmitting ? 'Updating...' : 'Update Balance'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Modal */}
      <Dialog open={passwordModal.open} onOpenChange={(open) => !open && setPasswordModal({ open: false, user: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password - {passwordModal.user?.username}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">New Password</label>
              <Input
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordModal({ open: false, user: null })}>
              Cancel
            </Button>
            <Button onClick={handlePasswordSubmit} disabled={isSubmitting || !newPassword}>
              {isSubmitting ? 'Updating...' : 'Update Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Freeze Confirm Modal */}
      <Dialog open={freezeConfirm.open} onOpenChange={(open) => !open && setFreezeConfirm({ open: false, user: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {freezeConfirm.user?.status === 'active' ? 'Freeze' : 'Unfreeze'} Account
            </DialogTitle>
          </DialogHeader>
          <p className="py-4">
            Are you sure you want to {freezeConfirm.user?.status === 'active' ? 'freeze' : 'unfreeze'} the account for <strong>{freezeConfirm.user?.username}</strong>?
            {freezeConfirm.user?.status === 'active' && (
              <span className="block text-sm text-muted-foreground mt-2">
                Frozen accounts cannot trade or withdraw.
              </span>
            )}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFreezeConfirm({ open: false, user: null })}>
              Cancel
            </Button>
            <Button 
              variant={freezeConfirm.user?.status === 'active' ? 'destructive' : 'default'}
              onClick={handleFreezeToggle} 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Processing...' : (freezeConfirm.user?.status === 'active' ? 'Freeze' : 'Unfreeze')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Trades Control Modal */}
      <Dialog open={tradesModal.open} onOpenChange={(open) => !open && setTradesModal({ open: false, user: null, trades: [] })}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Pending Trades - {tradesModal.user?.username}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {tradesModal.trades.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No pending trades</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pair</TableHead>
                    <TableHead>Side</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Profit Rate</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tradesModal.trades.map((trade) => (
                    <TableRow key={trade.id}>
                      <TableCell>{trade.pair}</TableCell>
                      <TableCell>
                        <Badge className={trade.side === 'long' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}>
                          {trade.side.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>{trade.amount} USDT</TableCell>
                      <TableCell>{trade.duration}s</TableCell>
                      <TableCell>{(trade.profitRate * 100).toFixed(0)}%</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            className="bg-green-500 hover:bg-green-600"
                            onClick={() => handleTradeOutcome(trade.id, 'win')}
                            disabled={isSubmitting}
                          >
                            Win
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleTradeOutcome(trade.id, 'loss')}
                            disabled={isSubmitting}
                          >
                            Loss
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
