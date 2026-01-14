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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Search, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface TransactionWithUser {
  id: string;
  user_id: string;
  username: string | null;
  type: string;
  amount: number;
  currency: string;
  status: string;
  network: string | null;
  note: string | null;
  created_at: string;
}

const AdminTransactions = () => {
  const [transactions, setTransactions] = useState<TransactionWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('transactions')
        .select('*', { count: 'exact' });

      if (typeFilter !== 'all') {
        query = query.eq('type', typeFilter as 'deposit' | 'withdraw' | 'trade' | 'loan' | 'repayment' | 'transfer');
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as 'pending' | 'completed' | 'failed' | 'cancelled');
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      const { data: txs, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      // Get usernames for transactions
      const userIds = [...new Set(txs?.map(t => t.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username, email')
        .in('user_id', userIds);

      const transactionsWithUsers: TransactionWithUser[] = (txs || []).map(tx => {
        const profile = profiles?.find(p => p.user_id === tx.user_id);
        return {
          ...tx,
          username: profile?.username || profile?.email || tx.user_id.slice(0, 8),
        };
      });

      setTransactions(transactionsWithUsers);
      setTotalCount(count || 0);
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      toast.error('获取交易记录失败');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [page, typeFilter, statusFilter]);

  const totalPages = Math.ceil(totalCount / pageSize);

  const getTypeBadge = (type: string) => {
    const config: Record<string, { color: string; label: string }> = {
      deposit: { color: 'bg-green-500/20 text-green-500', label: '充值' },
      withdraw: { color: 'bg-orange-500/20 text-orange-500', label: '提现' },
      trade: { color: 'bg-blue-500/20 text-blue-500', label: '交易' },
      loan: { color: 'bg-purple-500/20 text-purple-500', label: '贷款' },
      repayment: { color: 'bg-cyan-500/20 text-cyan-500', label: '还款' },
      transfer: { color: 'bg-yellow-500/20 text-yellow-500', label: '转账' },
    };
    const item = config[type] || { color: 'bg-muted', label: type };
    return <Badge className={item.color}>{item.label}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; label: string }> = {
      pending: { color: 'bg-yellow-500/20 text-yellow-500', label: '待处理' },
      completed: { color: 'bg-green-500/20 text-green-500', label: '已完成' },
      failed: { color: 'bg-red-500/20 text-red-500', label: '失败' },
      cancelled: { color: 'bg-gray-500/20 text-gray-500', label: '已取消' },
    };
    const item = config[status] || { color: 'bg-muted', label: status };
    return <Badge className={item.color}>{item.label}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between flex-wrap gap-4">
          <span>交易记录</span>
          <div className="flex items-center gap-3">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="类型" />
              </SelectTrigger>
              <SelectContent className="bg-popover border border-border">
                <SelectItem value="all">全部类型</SelectItem>
                <SelectItem value="deposit">充值</SelectItem>
                <SelectItem value="withdraw">提现</SelectItem>
                <SelectItem value="trade">交易</SelectItem>
                <SelectItem value="loan">贷款</SelectItem>
                <SelectItem value="repayment">还款</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="状态" />
              </SelectTrigger>
              <SelectContent className="bg-popover border border-border">
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="pending">待处理</SelectItem>
                <SelectItem value="completed">已完成</SelectItem>
                <SelectItem value="failed">失败</SelectItem>
                <SelectItem value="cancelled">已取消</SelectItem>
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
                <TableHead>ID</TableHead>
                <TableHead>用户</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>金额</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>网络</TableHead>
                <TableHead>备注</TableHead>
                <TableHead>日期</TableHead>
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
              ) : transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    暂无交易记录
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="font-mono text-xs">
                      {tx.id.slice(0, 8)}...
                    </TableCell>
                    <TableCell className="font-medium">{tx.username}</TableCell>
                    <TableCell>{getTypeBadge(tx.type)}</TableCell>
                    <TableCell>{tx.amount.toLocaleString()} {tx.currency}</TableCell>
                    <TableCell>{getStatusBadge(tx.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{tx.network || '-'}</TableCell>
                    <TableCell className="max-w-[150px] truncate text-sm text-muted-foreground">
                      {tx.note || '-'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(tx.created_at), 'yyyy-MM-dd HH:mm')}
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
    </Card>
  );
};

export default AdminTransactions;
