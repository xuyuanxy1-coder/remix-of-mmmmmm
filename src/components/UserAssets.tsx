import { useAssets } from '@/contexts/AssetsContext';
import { Wallet } from 'lucide-react';

const UserAssets = () => {
  const { assets } = useAssets();

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <Wallet className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">My Assets</h3>
      </div>
      <div className="space-y-3">
        {assets.map((asset) => (
          <div key={asset.symbol} className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
            <div className="flex items-center gap-3">
              <span className="text-xl">{asset.icon}</span>
              <div>
                <p className="font-medium text-sm">{asset.symbol}</p>
                <p className="text-xs text-muted-foreground">{asset.name}</p>
              </div>
            </div>
            <p className="font-medium">
              {asset.balance.toLocaleString(undefined, { 
                minimumFractionDigits: asset.symbol === 'USDT' ? 2 : 4,
                maximumFractionDigits: asset.symbol === 'USDT' ? 2 : 8 
              })}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserAssets;
