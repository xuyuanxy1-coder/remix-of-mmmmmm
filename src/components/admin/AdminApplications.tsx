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
      toast.error(error.message || 'Failed to fetch applications');
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
      toast.success('Application approved');
      fetchApplications();
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve application');
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
      toast.success(`${rejectModal.ids.length} application(s) rejected`);
      setRejectModal({ open: false, ids: [] });
      setRejectReason('');
      setSelectedIds([]);
      fetchApplications();
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject applications');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBatchApprove = async () => {
    if (selectedIds.length === 0) return;
    
    setIsSubmitting(true);
    try {
      await adminApi.batchApproveApplications(selectedIds);
      toast.success(`${selectedIds.length} applications approved`);
      setSelectedIds([]);
      fetchApplications();
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve applications');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      loan: 'bg-blue-500/20 text-blue-500',
      repayment: 'bg-green-500/20 text-green-500',
      verify: 'bg-purple-500/20 text-purple-500',
      recharge: 'bg-yellow-500/20 text-yellow-500',
      withdraw: 'bg-orange-500/20 text-orange-500',
    };
    return <Badge className={colors[type] || 'bg-muted'}>{type.toUpperCase()}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between flex-wrap gap-4">
          <span>Application Review</span>
          <div className="flex items-center gap-3">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="loan">Loan</SelectItem>
                <SelectItem value="repayment">Repayment</SelectItem>
                <SelectItem value="verify">Verify</SelectItem>
                <SelectItem value="recharge">Recharge</SelectItem>
                <SelectItem value="withdraw">Withdraw</SelectItem>
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
                  Approve ({selectedIds.length})
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setRejectModal({ open: true, ids: selectedIds })}
                  disabled={isSubmitting}
                >
                  <X className="w-4 h-4 mr-1" />
                  Reject ({selectedIds.length})
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
                <TableHead>User</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Details</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      Loading...
                    </div>
                  </TableCell>
                </TableRow>
              ) : applications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No pending applications
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
                      {format(new Date(app.createdAt), 'MMM dd, yyyy HH:mm')}
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
            <DialogTitle>Reject Application{rejectModal.ids.length > 1 ? 's' : ''}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              You are about to reject {rejectModal.ids.length} application{rejectModal.ids.length > 1 ? 's' : ''}.
            </p>
            <div className="space-y-2">
              <label className="text-sm font-medium">Reason (optional)</label>
              <Textarea
                placeholder="Enter rejection reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectModal({ open: false, ids: [] })}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={isSubmitting}>
              {isSubmitting ? 'Rejecting...' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default AdminApplications;
