import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Save, Wallet } from 'lucide-react';
import { adminApi, AdminConfig } from '@/lib/adminApi';

const NETWORKS = [
  { id: 'ERC20-USDT', name: 'ERC20 (USDT)', icon: '⟠' },
  { id: 'TRC20-USDT', name: 'TRC20 (USDT)', icon: '🔺' },
  { id: 'ETH', name: 'Ethereum (ETH)', icon: '⟠' },
];

const AdminSettings = () => {
  const [config, setConfig] = useState<AdminConfig | null>(null);
  const [addresses, setAddresses] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const data = await adminApi.getConfig();
        setConfig(data);
        
        // Convert array to object for easier editing
        const addressMap: Record<string, string> = {};
        data.rechargeAddresses.forEach(item => {
          addressMap[item.network] = item.address;
        });
        setAddresses(addressMap);
      } catch (error: any) {
        toast.error(error.message || 'Failed to load config');
      } finally {
        setIsLoading(false);
      }
    };

    fetchConfig();
  }, []);

  const handleSaveAddress = async (network: string) => {
    const address = addresses[network];
    if (!address) {
      toast.error('Please enter an address');
      return;
    }

    setIsSaving(network);
    try {
      await adminApi.updateRechargeAddress(network, address);
      toast.success(`${network} address updated successfully`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update address');
    } finally {
      setIsSaving(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            Loading settings...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Recharge Wallet Addresses
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {NETWORKS.map((network) => (
            <div key={network.id} className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">{network.icon}</span>
                <label className="text-sm font-medium">{network.name}</label>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder={`Enter ${network.name} wallet address`}
                  value={addresses[network.id] || ''}
                  onChange={(e) => setAddresses({ ...addresses, [network.id]: e.target.value })}
                  className="font-mono text-sm"
                />
                <Button
                  onClick={() => handleSaveAddress(network.id)}
                  disabled={isSaving === network.id}
                  className="shrink-0"
                >
                  {isSaving === network.id ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-1" />
                      Save
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}
          <p className="text-xs text-muted-foreground mt-4">
            These addresses will be displayed to users when they want to recharge their accounts.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSettings;
