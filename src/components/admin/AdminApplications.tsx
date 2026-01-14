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
import { adminApi, Application } from '@/lib/adminApi';
import { format } from 'date-fns';

const AdminApplications = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [rejectModal, setRejectModal] = useState<{ open: boolean; ids: string[] }>({ open: false, ids: [] });
  const [rejectReason, setRejectReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const type = typeFilter === 'all' ? undefined : typeFilter;
      const data = await adminApi.getApplications(type);
      setApplications(data.filter(app => app.status === 'pending'));
    } catch (error: any) {
      toast.error(error.message || '获取申请列表失败');
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

  const handleApprove = async (id: string) => {
    setIsSubmitting(true);
    try {
      await adminApi.approveApplication(id);
      toast.success('申请已通过');
      fetchApplications();
    } catch (error: any) {
      toast.error(error.message || '审批失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (rejectModal.ids.length === 0) return;
    
    setIsSubmitting(true);
    try {
      if (rejectModal.ids.length === 1) {
        await adminApi.rejectApplication(rejectModal.ids[0], rejectReason);
      } else {
        await adminApi.batchRejectApplications(rejectModal.ids, rejectReason);
      }
      toast.success(`已拒绝 ${rejectModal.ids.length} 个申请`);
      setRejectModal({ open: false, ids: [] });
      setRejectReason('');
      setSelectedIds([]);
      fetchApplications();
    } catch (error: any) {
      toast.error(error.message || '拒绝失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBatchApprove = async () => {
    if (selectedIds.length === 0) return;
    
    setIsSubmitting(true);
    try {
      await adminApi.batchApproveApplications(selectedIds);
      toast.success(`已通过 ${selectedIds.length} 个申请`);
      setSelectedIds([]);
      fetchApplications();
    } catch (error: any) {
      toast.error(error.message || '批量审批失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTypeBadge = (type: string) => {
    const config: Record<string, { color: string; label: string }> = {
      loan: { color: 'bg-blue-500/20 text-blue-500', label: '贷款' },
      repayment: { color: 'bg-green-500/20 text-green-500', label: '还款' },
      verify: { color: 'bg-purple-500/20 text-purple-500', label: '实名认证' },
      recharge: { color: 'bg-yellow-500/20 text-yellow-500', label: '充值' },
      withdraw: { color: 'bg-orange-500/20 text-orange-500', label: '提现' },
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
                <SelectItem value="loan">贷款</SelectItem>
                <SelectItem value="repayment">还款</SelectItem>
                <SelectItem value="verify">实名认证</SelectItem>
                <SelectItem value="recharge">充值</SelectItem>
                <SelectItem value="withdraw">提现</SelectItem>
              </SelectContent>
            </Select>
            {selectedIds.length > 0 && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="bg-green-500 hover:bg-green-600"
                  onClick={handleBatchApprove}
                  disabled={isSubmitting}
                >
                  <Check className="w-4 h-4 mr-1" />
                  通过 ({selectedIds.length})
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setRejectModal({ open: true, ids: selectedIds })}
                  disabled={isSubmitting}
                >
                  <X className="w-4 h-4 mr-1" />
                  拒绝 ({selectedIds.length})
                </Button>
              </div>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedIds.length === applications.length && applications.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
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
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      加载中...
                    </div>
                  </TableCell>
                </TableRow>
              ) : applications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    暂无待处理申请
                  </TableCell>
                </TableRow>
              ) : (
                applications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(app.id)}
                        onCheckedChange={(checked) => handleSelectOne(app.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{app.username}</TableCell>
                    <TableCell>{getTypeBadge(app.type)}</TableCell>
                    <TableCell>
                      {app.amount ? `${app.amount.toLocaleString()} USDT` : '-'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(app.createdAt), 'yyyy-MM-dd HH:mm')}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                      {app.details ? JSON.stringify(app.details) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          className="bg-green-500 hover:bg-green-600"
                          onClick={() => handleApprove(app.id)}
                          disabled={isSubmitting}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setRejectModal({ open: true, ids: [app.id] })}
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
      <Dialog open={rejectModal.open} onOpenChange={(open) => !open && setRejectModal({ open: false, ids: [] })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>拒绝申请</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              您即将拒绝 {rejectModal.ids.length} 个申请。
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
            <Button variant="outline" onClick={() => setRejectModal({ open: false, ids: [] })}>
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
