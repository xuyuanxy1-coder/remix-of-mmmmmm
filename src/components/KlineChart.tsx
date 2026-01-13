import { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, CandlestickData, Time, CandlestickSeries } from 'lightweight-charts';
import { useTheme } from '@/contexts/ThemeContext';

interface KlineChartProps {
  symbol: string;
}

// Generate mock kline data
const generateMockKlineData = (symbol: string): CandlestickData<Time>[] => {
  const basePrice = symbol === 'BTC' ? 92000 : 
                    symbol === 'ETH' ? 3100 : 
                    symbol === 'BNB' ? 900 : 
                    symbol === 'SOL' ? 140 : 100;
  
  const data: CandlestickData<Time>[] = [];
  const now = Math.floor(Date.now() / 1000);
  const oneDay = 86400;
  
  let price = basePrice;
  
  for (let i = 100; i >= 0; i--) {
    const volatility = basePrice * 0.02;
    const open = price;
    const change = (Math.random() - 0.5) * volatility;
    const close = open + change;
    const high = Math.max(open, close) + Math.random() * volatility * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * 0.5;
    
    data.push({
      time: (now - i * oneDay) as Time,
      open,
      high,
      low,
      close,
    });
    
    price = close;
  }
  
  return data;
};

const KlineChart = ({ symbol }: KlineChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    setIsLoading(true);

    const isDark = theme === 'dark';
    
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 400,
      layout: {
        background: { color: isDark ? 'hsl(220, 15%, 12%)' : 'hsl(0, 0%, 100%)' },
        textColor: isDark ? 'hsl(210, 40%, 98%)' : 'hsl(220, 10%, 15%)',
      },
      grid: {
        vertLines: { color: isDark ? 'hsl(220, 15%, 20%)' : 'hsl(220, 10%, 90%)' },
        horzLines: { color: isDark ? 'hsl(220, 15%, 20%)' : 'hsl(220, 10%, 90%)' },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: isDark ? 'hsl(220, 15%, 20%)' : 'hsl(220, 10%, 90%)',
      },
      timeScale: {
        borderColor: isDark ? 'hsl(220, 15%, 20%)' : 'hsl(220, 10%, 90%)',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    chartRef.current = chart;

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: 'hsl(145, 60%, 45%)',
      downColor: 'hsl(0, 70%, 55%)',
      borderDownColor: 'hsl(0, 70%, 55%)',
      borderUpColor: 'hsl(145, 60%, 45%)',
      wickDownColor: 'hsl(0, 70%, 55%)',
      wickUpColor: 'hsl(145, 60%, 45%)',
    });

    // Simulate API fetch with mock data
    setTimeout(() => {
      const data = generateMockKlineData(symbol);
      candlestickSeries.setData(data);
      chart.timeScale().fitContent();
      setIsLoading(false);
    }, 500);

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [symbol, theme]);

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-card/80 z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}
      <div ref={chartContainerRef} className="w-full rounded-lg overflow-hidden" />
    </div>
  );
};

export default KlineChart;
