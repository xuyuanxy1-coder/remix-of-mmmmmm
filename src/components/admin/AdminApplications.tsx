import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Check, X, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

type ApplicationType = 'deposit' | 'withdraw' | 'loan' | 'kyc';

interface Application {
  id: string;
  user_id: string;
  username: string | null;
  type: ApplicationType;
  amount?: number;
  currency?: string;
  status: string;
  created_at: string;
  details?: string;
  table_name: string;
}

const AdminApplications = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [rejectModal, setRejectModal] = useState<{ open: boolean; app: Application | null }>({ open: false, app: null });
  const [rejectReason, setRejectReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const allApplications: Application[] = [];

      // Fetch pending transactions (deposits and withdrawals)
      if (typeFilter === 'all' || typeFilter === 'deposit' || typeFilter === 'withdraw') {
        let txQuery = supabase
          .from('transactions')
          .select('*')
          .eq('status', 'pending');
        
        if (typeFilter === 'deposit') {
          txQuery = txQuery.eq('type', 'deposit');
        } else if (typeFilter === 'withdraw') {
          txQuery = txQuery.eq('type', 'withdraw');
        } else {
          txQuery = txQuery.in('type', ['deposit', 'withdraw']);
        }

        const { data: txs } = await txQuery.order('created_at', { ascending: false });

        if (txs) {
          const userIds = [...new Set(txs.map(t => t.user_id))];
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, username, email')
            .in('user_id', userIds);

          txs.forEach(tx => {
            const profile = profiles?.find(p => p.user_id === tx.user_id);
            allApplications.push({
              id: tx.id,
              user_id: tx.user_id,
              username: profile?.username || profile?.email || tx.user_id.slice(0, 8),
              type: tx.type as ApplicationType,
              amount: tx.amount,
              currency: tx.currency,
              status: tx.status,
              created_at: tx.created_at,
              details: tx.note || undefined,
              table_name: 'transactions',
            });
          });
        }
      }

      // Fetch pending loans
      if (typeFilter === 'all' || typeFilter === 'loan') {
        const { data: loans } = await supabase
          .from('loans')
          .select('*')
          .eq('status', 'pending')
          .order('created_at', { ascending: false });

        if (loans) {
          const userIds = [...new Set(loans.map(l => l.user_id))];
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, username, email')
            .in('user_id', userIds);

          loans.forEach(loan => {
            const profile = profiles?.find(p => p.user_id === loan.user_id);
            allApplications.push({
              id: loan.id,
              user_id: loan.user_id,
              username: profile?.username || profile?.email || loan.user_id.slice(0, 8),
              type: 'loan',
              amount: loan.amount,
              currency: loan.currency,
              status: loan.status,
              created_at: loan.created_at,
              details: `期限: ${loan.term_days}天, 利率: ${loan.interest_rate}%`,
              table_name: 'loans',
            });
          });
        }
      }

      // Fetch pending KYC
      if (typeFilter === 'all' || typeFilter === 'kyc') {
        const { data: kycRecords } = await supabase
          .from('kyc_records')
          .select('*')
          .eq('status', 'pending')
          .order('created_at', { ascending: false });

        if (kycRecords) {
          const userIds = [...new Set(kycRecords.map(k => k.user_id))];
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, username, email')
            .in('user_id', userIds);

          kycRecords.forEach(kyc => {
            const profile = profiles?.find(p => p.user_id === kyc.user_id);
            allApplications.push({
              id: kyc.id,
              user_id: kyc.user_id,
              username: profile?.username || profile?.email || kyc.user_id.slice(0, 8),
              type: 'kyc',
              status: kyc.status,
              created_at: kyc.created_at,
              details: `姓名: ${kyc.real_name}, 证件: ${kyc.id_type}`,
              table_name: 'kyc_records',
            });
          });
        }
      }

      // Sort by created_at
      allApplications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setApplications(allApplications);
    } catch (error: any) {
      console.error('Error fetching applications:', error);
      toast.error('获取申请列表失败');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [typeFilter]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(applications.map(app => app.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter(i => i !== id));
    }
  };

  const handleApprove = async (app: Application) => {
    setIsSubmitting(true);
    try {
      if (app.table_name === 'transactions') {
        // For deposits, also update user balance
        if (app.type === 'deposit') {
          const { data: asset } = await supabase
            .from('assets')
            .select('balance')
            .eq('user_id', app.user_id)
            .eq('currency', app.currency || 'USDT')
            .single();

          const newBalance = (asset?.balance || 0) + (app.amount || 0);
          
          await supabase
            .from('assets')
            .update({ balance: newBalance })
            .eq('user_id', app.user_id)
            .eq('currency', app.currency || 'USDT');
        }

        await supabase
          .from('transactions')
          .update({ status: 'completed' })
          .eq('id', app.id);
      } else if (app.table_name === 'loans') {
        // Approve loan and add to user balance
        const { data: asset } = await supabase
          .from('assets')
          .select('balance')
          .eq('user_id', app.user_id)
          .eq('currency', app.currency || 'USDT')
          .single();

        const newBalance = (asset?.balance || 0) + (app.amount || 0);
        
        await supabase
          .from('assets')
          .update({ balance: newBalance })
          .eq('user_id', app.user_id)
          .eq('currency', app.currency || 'USDT');

        await supabase
          .from('loans')
          .update({ 
            status: 'approved',
            approved_at: new Date().toISOString(),
            due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
          })
          .eq('id', app.id);
      } else if (app.table_name === 'kyc_records') {
        await supabase
          .from('kyc_records')
          .update({ 
            status: 'approved',
            reviewed_at: new Date().toISOString(),
          })
          .eq('id', app.id);
      }

      toast.success('申请已通过');
      fetchApplications();
    } catch (error: any) {
      console.error('Error approving:', error);
      toast.error('审批失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectModal.app) return;
    
    setIsSubmitting(true);
    try {
      const app = rejectModal.app;
      
      if (app.table_name === 'transactions') {
        await supabase
          .from('transactions')
          .update({ status: 'cancelled', note: rejectReason || app.details })
          .eq('id', app.id);
      } else if (app.table_name === 'loans') {
        await supabase
          .from('loans')
          .update({ status: 'rejected' })
          .eq('id', app.id);
      } else if (app.table_name === 'kyc_records') {
        await supabase
          .from('kyc_records')
          .update({ 
            status: 'rejected',
            reject_reason: rejectReason,
            reviewed_at: new Date().toISOString(),
          })
          .eq('id', app.id);
      }

      toast.success('申请已拒绝');
      setRejectModal({ open: false, app: null });
      setRejectReason('');
      fetchApplications();
    } catch (error: any) {
      console.error('Error rejecting:', error);
      toast.error('拒绝失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTypeBadge = (type: string) => {
    const config: Record<string, { color: string; label: string }> = {
      deposit: { color: 'bg-green-500/20 text-green-500', label: '充值' },
      withdraw: { color: 'bg-orange-500/20 text-orange-500', label: '提现' },
      loan: { color: 'bg-blue-500/20 text-blue-500', label: '贷款' },
      kyc: { color: 'bg-purple-500/20 text-purple-500', label: '实名认证' },
    };
    const item = config[type] || { color: 'bg-muted', label: type };
    return <Badge className={item.color}>{item.label}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between flex-wrap gap-4">
          <span>申请审核</span>
          <div className="flex items-center gap-3">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="筛选类型" />
              </SelectTrigger>
              <SelectContent className="bg-popover border border-border">
                <SelectItem value="all">全部类型</SelectItem>
                <SelectItem value="deposit">充值</SelectItem>
                <SelectItem value="withdraw">提现</SelectItem>
                <SelectItem value="loan">贷款</SelectItem>
                <SelectItem value="kyc">实名认证</SelectItem>
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
                <TableHead>用户</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>金额</TableHead>
                <TableHead>日期</TableHead>
                <TableHead>详情</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      加载中...
                    </div>
                  </TableCell>
                </TableRow>
              ) : applications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    暂无待处理申请
                  </TableCell>
                </TableRow>
              ) : (
                applications.map((app) => (
                  <TableRow key={`${app.table_name}-${app.id}`}>
                    <TableCell className="font-medium">{app.username}</TableCell>
                    <TableCell>{getTypeBadge(app.type)}</TableCell>
                    <TableCell>
                      {app.amount ? `${app.amount.toLocaleString()} ${app.currency || 'USDT'}` : '-'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(app.created_at), 'yyyy-MM-dd HH:mm')}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                      {app.details || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          className="bg-green-500 hover:bg-green-600"
                          onClick={() => handleApprove(app)}
                          disabled={isSubmitting}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setRejectModal({ open: true, app })}
                          disabled={isSubmitting}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Reject Modal */}
      <Dialog open={rejectModal.open} onOpenChange={(open) => !open && setRejectModal({ open: false, app: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>拒绝申请</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              您即将拒绝此申请。
            </p>
            <div className="space-y-2">
              <label className="text-sm font-medium">拒绝原因（可选）</label>
              <Textarea
                placeholder="请输入拒绝原因"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectModal({ open: false, app: null })}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={isSubmitting}>
              {isSubmitting ? '处理中...' : '确认拒绝'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default AdminApplications;
