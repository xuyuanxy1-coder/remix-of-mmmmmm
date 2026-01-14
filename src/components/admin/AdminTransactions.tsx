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
import { toast } from 'sonner';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { adminApi, Transaction } from '@/lib/adminApi';
import { format } from 'date-fns';

const AdminTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userIdFilter, setUserIdFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const response = await adminApi.getTransactions({
        userId: userIdFilter || undefined,
        page,
        limit: 20,
      });
      setTransactions(response.transactions);
      setTotalPages(response.totalPages);
    } catch (error: any) {
      toast.error(error.message || '获取交易记录失败');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchTransactions();
    }, 300);
    return () => clearTimeout(timer);
  }, [userIdFilter]);

  const getTypeBadge = (type: string) => {
    const config: Record<string, { color: string; label: string }> = {
      trade: { color: 'bg-blue-500/20 text-blue-500', label: '交易' },
      loan: { color: 'bg-purple-500/20 text-purple-500', label: '贷款' },
      repayment: { color: 'bg-green-500/20 text-green-500', label: '还款' },
      recharge: { color: 'bg-yellow-500/20 text-yellow-500', label: '充值' },
      withdraw: { color: 'bg-orange-500/20 text-orange-500', label: '提现' },
    };
    const item = config[type] || { color: 'bg-muted', label: type };
    return <Badge className={item.color}>{item.label}</Badge>;
  };

  const getResultBadge = (result?: string) => {
    if (!result) return null;
    return result === 'win' 
      ? <Badge className="bg-green-500/20 text-green-500">盈利</Badge>
      : <Badge className="bg-red-500/20 text-red-500">亏损</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>交易记录</span>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="按用户ID筛选..."
              value={userIdFilter}
              onChange={(e) => setUserIdFilter(e.target.value)}
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
                <TableHead>ID</TableHead>
                <TableHead>用户</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>金额</TableHead>
                <TableHead>结果</TableHead>
                <TableHead>盈亏</TableHead>
                <TableHead>日期</TableHead>
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
              ) : transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
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
                    <TableCell>{tx.amount.toLocaleString()} USDT</TableCell>
                    <TableCell>{getResultBadge(tx.result)}</TableCell>
                    <TableCell>
                      {tx.profit !== undefined && (
                        <span className={tx.profit >= 0 ? 'text-green-500' : 'text-red-500'}>
                          {tx.profit >= 0 ? '+' : ''}{tx.profit.toLocaleString()} USDT
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(tx.createdAt), 'yyyy-MM-dd HH:mm')}
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
