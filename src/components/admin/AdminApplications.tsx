import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Check, X, Filter, Image, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

type ApplicationType = 'deposit' | 'withdraw' | 'loan' | 'kyc' | 'repayment';

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
  // KYC specific fields
  front_image_url?: string;
  back_image_url?: string;
  selfie_url?: string;
  real_name?: string;
  id_type?: string;
  id_number?: string;
  // Repayment specific
  loan_id?: string;
  repayment_type?: string;
  receipt_image_url?: string;
}

const AdminApplications = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [rejectModal, setRejectModal] = useState<{ open: boolean; app: Application | null }>({ open: false, app: null });
  const [rejectReason, setRejectReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [kycDetailModal, setKycDetailModal] = useState<{ open: boolean; app: Application | null }>({ open: false, app: null });
  const [imagePreview, setImagePreview] = useState<{ open: boolean; url: string; title: string }>({ open: false, url: '', title: '' });

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

      // Fetch pending loan repayments
      if (typeFilter === 'all' || typeFilter === 'repayment') {
        const { data: repayments } = await supabase
          .from('loan_repayments')
          .select('*')
          .eq('status', 'pending')
          .order('created_at', { ascending: false });

        if (repayments) {
          const userIds = [...new Set(repayments.map(r => r.user_id))];
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, username, email')
            .in('user_id', userIds);

          repayments.forEach(repayment => {
            const profile = profiles?.find(p => p.user_id === repayment.user_id);
            const typeLabel = repayment.repayment_type === 'early_full' ? 'Early Full' : 
                             repayment.repayment_type === 'full' ? 'Full' : 'Partial';
            allApplications.push({
              id: repayment.id,
              user_id: repayment.user_id,
              username: profile?.username || profile?.email || repayment.user_id.slice(0, 8),
              type: 'repayment',
              amount: repayment.amount,
              currency: 'USDT',
              status: repayment.status,
              created_at: repayment.created_at,
              details: `${typeLabel} Repayment`,
              table_name: 'loan_repayments',
              loan_id: repayment.loan_id,
              repayment_type: repayment.repayment_type,
              receipt_image_url: repayment.receipt_image_url || undefined,
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
              front_image_url: kyc.front_image_url || undefined,
              back_image_url: kyc.back_image_url || undefined,
              selfie_url: kyc.selfie_url || undefined,
              real_name: kyc.real_name,
              id_type: kyc.id_type,
              id_number: kyc.id_number,
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
        const currency = app.currency || 'USDT';
        const loanAmount = app.amount || 0;
        
        // Check if asset record exists
        const { data: asset, error: assetError } = await supabase
          .from('assets')
          .select('balance')
          .eq('user_id', app.user_id)
          .eq('currency', currency)
          .single();

        if (assetError && assetError.code === 'PGRST116') {
          // Asset record doesn't exist, create it with loan amount
          await supabase
            .from('assets')
            .insert({
              user_id: app.user_id,
              currency,
              balance: loanAmount,
            });
        } else {
          // Asset exists, update balance
          const newBalance = (asset?.balance || 0) + loanAmount;
          await supabase
            .from('assets')
            .update({ balance: newBalance })
            .eq('user_id', app.user_id)
            .eq('currency', currency);
        }

        // Update loan status
        await supabase
          .from('loans')
          .update({ 
            status: 'approved',
            approved_at: new Date().toISOString(),
            due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
          })
          .eq('id', app.id);

        toast.success(`贷款已批准，${loanAmount} ${currency} 已添加到用户余额`);
        fetchApplications();
        return;
      } else if (app.table_name === 'loan_repayments') {
        // Approve repayment - update repayment status
        await supabase
          .from('loan_repayments')
          .update({ 
            status: 'approved',
            reviewed_at: new Date().toISOString(),
          })
          .eq('id', app.id);

        // Get current loan data
        const { data: loanData } = await supabase
          .from('loans')
          .select('amount')
          .eq('id', app.loan_id)
          .single();

        // Calculate remaining balance after this repayment
        // Get all approved repayments for this loan
        const { data: approvedRepayments } = await supabase
          .from('loan_repayments')
          .select('amount')
          .eq('loan_id', app.loan_id)
          .eq('status', 'approved');

        const totalRepaid = approvedRepayments?.reduce((sum, r) => sum + Number(r.amount), 0) || 0;
        const loanAmount = loanData?.amount || 0;

        // If full repayment or total repaid >= loan amount, mark loan as repaid
        if (app.repayment_type === 'full' || app.repayment_type === 'early_full' || totalRepaid >= loanAmount) {
          await supabase
            .from('loans')
            .update({ 
              status: 'repaid',
              repaid_at: new Date().toISOString(),
            })
            .eq('id', app.loan_id);
        }

        toast.success('Repayment approved');
        fetchApplications();
        return;
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
      } else if (app.table_name === 'loan_repayments') {
        await supabase
          .from('loan_repayments')
          .update({ 
            status: 'rejected',
            reject_reason: rejectReason,
            reviewed_at: new Date().toISOString(),
          })
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
      repayment: { color: 'bg-cyan-500/20 text-cyan-500', label: '贷款还款' },
    };
    const item = config[type] || { color: 'bg-muted', label: type };
    return <Badge className={item.color}>{item.label}</Badge>;
  };

  const openImagePreview = (url: string, title: string) => {
    setImagePreview({ open: true, url, title });
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
                <SelectItem value="repayment">贷款还款</SelectItem>
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
                      <div className="flex items-center gap-2">
                        <span className="truncate">{app.details || '-'}</span>
                        {app.type === 'kyc' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setKycDetailModal({ open: true, app })}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Button>
                        )}
                        {app.type === 'repayment' && app.receipt_image_url && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openImagePreview(app.receipt_image_url!, 'Payment Receipt')}
                          >
                            <Image className="w-3 h-3 mr-1" />
                            Receipt
                          </Button>
                        )}
                      </div>
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

      {/* KYC Detail Modal */}
      <Dialog open={kycDetailModal.open} onOpenChange={(open) => !open && setKycDetailModal({ open: false, app: null })}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>实名认证详情</DialogTitle>
          </DialogHeader>
          {kycDetailModal.app && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">真实姓名</p>
                  <p className="font-medium">{kycDetailModal.app.real_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">证件类型</p>
                  <p className="font-medium">{kycDetailModal.app.id_type}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">证件号码</p>
                  <p className="font-medium">{kycDetailModal.app.id_number}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <p className="text-sm font-medium">证件照片</p>
                <div className="grid grid-cols-3 gap-4">
                  {kycDetailModal.app.front_image_url ? (
                    <div 
                      className="border rounded-lg p-2 cursor-pointer hover:border-primary transition-colors"
                      onClick={() => openImagePreview(kycDetailModal.app!.front_image_url!, '证件正面')}
                    >
                      <img 
                        src={kycDetailModal.app.front_image_url} 
                        alt="证件正面"
                        className="w-full h-24 object-cover rounded"
                      />
                      <p className="text-xs text-center mt-1 text-muted-foreground">证件正面</p>
                    </div>
                  ) : (
                    <div className="border rounded-lg p-2 flex items-center justify-center h-32 bg-muted">
                      <p className="text-xs text-muted-foreground">未上传</p>
                    </div>
                  )}
                  
                  {kycDetailModal.app.back_image_url ? (
                    <div 
                      className="border rounded-lg p-2 cursor-pointer hover:border-primary transition-colors"
                      onClick={() => openImagePreview(kycDetailModal.app!.back_image_url!, '证件背面')}
                    >
                      <img 
                        src={kycDetailModal.app.back_image_url} 
                        alt="证件背面"
                        className="w-full h-24 object-cover rounded"
                      />
                      <p className="text-xs text-center mt-1 text-muted-foreground">证件背面</p>
                    </div>
                  ) : (
                    <div className="border rounded-lg p-2 flex items-center justify-center h-32 bg-muted">
                      <p className="text-xs text-muted-foreground">未上传</p>
                    </div>
                  )}
                  
                  {kycDetailModal.app.selfie_url ? (
                    <div 
                      className="border rounded-lg p-2 cursor-pointer hover:border-primary transition-colors"
                      onClick={() => openImagePreview(kycDetailModal.app!.selfie_url!, '手持证件照')}
                    >
                      <img 
                        src={kycDetailModal.app.selfie_url} 
                        alt="手持证件照"
                        className="w-full h-24 object-cover rounded"
                      />
                      <p className="text-xs text-center mt-1 text-muted-foreground">手持证件照</p>
                    </div>
                  ) : (
                    <div className="border rounded-lg p-2 flex items-center justify-center h-32 bg-muted">
                      <p className="text-xs text-muted-foreground">未上传</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setKycDetailModal({ open: false, app: null })}>
              关闭
            </Button>
            <Button
              className="bg-green-500 hover:bg-green-600"
              onClick={() => {
                if (kycDetailModal.app) {
                  handleApprove(kycDetailModal.app);
                  setKycDetailModal({ open: false, app: null });
                }
              }}
              disabled={isSubmitting}
            >
              <Check className="w-4 h-4 mr-1" />
              通过
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (kycDetailModal.app) {
                  setRejectModal({ open: true, app: kycDetailModal.app });
                  setKycDetailModal({ open: false, app: null });
                }
              }}
              disabled={isSubmitting}
            >
              <X className="w-4 h-4 mr-1" />
              拒绝
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Preview Modal */}
      <Dialog open={imagePreview.open} onOpenChange={(open) => !open && setImagePreview({ open: false, url: '', title: '' })}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{imagePreview.title}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-4">
            <img 
              src={imagePreview.url} 
              alt={imagePreview.title}
              className="max-w-full max-h-[70vh] object-contain rounded-lg"
            />
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default AdminApplications;
