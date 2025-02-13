"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { formatDistanceToNow, differenceInDays } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FaGlobe,
  FaXTwitter,
  FaTelegram,
  FaMedium,
  FaTiktok,
  FaYoutube,
  FaFacebook,
  FaGithub,
  FaInstagram,
  FaReddit,
  FaChevronDown,
  FaDiscord,
} from "react-icons/fa6";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { FilterDialog } from "@/components/filter-dialog";

interface CombinedPoolData {
  id: string;
  baseTokenId: string;
  name: string;
  symbol: string;
  imageUrl: string;
  pumpAddress: string;
  poolAddress: string;
  price: string;
  age: string;
  volume: string;
  liquidity: string;
  marketCapToHolder: number;
  fdv: number;
  changes: {
    '5m': string;
    '15m': string;
    '30m': string;
    '1h': string;
    '6h': string;
    '24h': string;
  };
  description: string;
  socialLinks: {
    websites: string[];
    discord_url: string | null;
    twitter_handle: string | null;
    telegram_handle: string | null;
    medium_handle: string | null;
    github_repo_name: string | null;
    subreddit_handle: string | null;
  };
  security: {
    gtScore: number;
    gtScoreDetails: {
      info: number;
      pool: number;
      transactions: number;
      holders: number;
      creation: number;
    };
    lockedLiquidity: {
      locked_percent: number;
      next_unlock_timestamp: string | null;
      final_unlock_timestamp: string | null;
    };
  };
  swapCount24h: number;
}

export default function PumpFun() {
  const [pools, setPools] = useState<CombinedPoolData[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState("24h");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPools = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/pump-fun-combined?period=${selectedPeriod}`);
        if (response.ok) {
          const data = await response.json();
          // Sort data based on selected period's change percentage
          const sortedData = data.sort((a: CombinedPoolData, b: CombinedPoolData) => {
            const aChange = parseFloat(a.changes[selectedPeriod as keyof typeof a.changes]);
            const bChange = parseFloat(b.changes[selectedPeriod as keyof typeof b.changes]);
            return bChange - aChange;
          });
          setPools(sortedData);
        }
      } catch (error) {
        console.error('Error fetching pools:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPools();
  }, [selectedPeriod]);

  // Helper functions
  const formatPercent = (value: string) => {
    const num = parseFloat(value);
    const formatted = num.toFixed(2);
    const color = num >= 0 ? 'text-green-500' : 'text-red-500';
    return <span className={color}>{num >= 0 ? `+${formatted}%` : `${formatted}%`}</span>;
  };

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (num >= 1e6) {
      return `$${(num / 1e6).toFixed(2)}M`;
    }
    if (num >= 1e3) {
      return `$${(num / 1e3).toFixed(2)}K`;
    }
    return `$${num.toFixed(2)}`;
  };

  const formatAge = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const daysDiff = differenceInDays(now, date);
      
      if (daysDiff >= 30) {
        const months = Math.floor(daysDiff / 30);
        return `${months}M`;
      }
      if (daysDiff >= 7) {
        const weeks = Math.floor(daysDiff / 7);
        return `${weeks}W`;
      }
      if (daysDiff >= 1) {
        return `${daysDiff}d`;
      }
      const hours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
      return `${hours}h`;
    } catch {
      return 'N/A';
    }
  };

  const SocialLinks = ({ pool }: { pool: CombinedPoolData }) => (
    <div className="flex gap-2 mt-1">
      {pool.socialLinks.websites[0] && (
        <a href={pool.socialLinks.websites[0]} target="_blank" rel="noopener noreferrer">
          <FaGlobe className="text-gray-400 hover:text-white" size={14} />
        </a>
      )}
      {pool.socialLinks.twitter_handle && (
        <a href={`https://twitter.com/${pool.socialLinks.twitter_handle}`} target="_blank" rel="noopener noreferrer">
          <FaXTwitter className="text-gray-400 hover:text-white" size={14} />
        </a>
      )}      
      {pool.socialLinks.discord_url && (
        <a href={pool.socialLinks.discord_url} target="_blank" rel="noopener noreferrer">
          <FaDiscord className="text-gray-400 hover:text-white" size={14} />
        </a>
      )}
      {pool.socialLinks.subreddit_handle && (
        <a href={`https://www.reddit.com/r/${pool.socialLinks.subreddit_handle}`} target="_blank" rel="noopener noreferrer">
          <FaReddit className="text-gray-400 hover:text-white" size={14} />
        </a>
      )}
    </div>
  );

  const SecurityScore = ({ security }: { security: CombinedPoolData['security'] }) => (
    <div className="flex items-center gap-2 mt-1">
      <div className="text-sm font-medium">
        Score: {security.gtScore.toFixed(1)}
      </div>
      <Popover>
        <PopoverTrigger>
          <div className="flex items-center text-gray-400 hover:text-white cursor-pointer">
            Details <FaChevronDown size={12} className="ml-1" />
          </div>
        </PopoverTrigger>
        <PopoverContent className="bg-gray-800 border-gray-700 text-white p-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Info:</span>
              <span>{security.gtScoreDetails.info}</span>
            </div>
            <div className="flex justify-between">
              <span>Pool:</span>
              <span>{security.gtScoreDetails.pool}</span>
            </div>
            <div className="flex justify-between">
              <span>Transactions:</span>
              <span>{security.gtScoreDetails.transactions}</span>
            </div>
            <div className="flex justify-between">
              <span>Holders:</span>
              <span>{security.gtScoreDetails.holders}</span>
            </div>
            <div className="flex justify-between">
              <span>Creation:</span>
              <span>{security.gtScoreDetails.creation}</span>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );

  const handleApplyFilters = async (filters: any) => {
    try {
      const queryParams = new URLSearchParams();
      
      // Add filter parameters
      if (filters.liquidity.min) queryParams.append('liquidity[gte]', filters.liquidity.min);
      if (filters.liquidity.max) queryParams.append('liquidity[lte]', filters.liquidity.max);
      if (filters.fdv.min) queryParams.append('fdv_in_usd[gte]', filters.fdv.min);
      if (filters.fdv.max) queryParams.append('fdv_in_usd[lte]', filters.fdv.max);
      if (filters.volume.min) queryParams.append('volume_24h[gte]', filters.volume.min);
      if (filters.volume.max) queryParams.append('volume_24h[lte]', filters.volume.max);
      if (filters.txn.min) queryParams.append('tx_count_24h[gte]', filters.txn.min);
      if (filters.txn.max) queryParams.append('tx_count_24h[lte]', filters.txn.max);
      if (filters.buy.min) queryParams.append('buys_24h[gte]', filters.buy.min);
      if (filters.buy.max) queryParams.append('buys_24h[lte]', filters.buy.max);
      if (filters.sell.min) queryParams.append('sells_24h[gte]', filters.sell.min);
      if (filters.sell.max) queryParams.append('sells_24h[lte]', filters.sell.max);
      
      // Add period parameter
      queryParams.append('period', selectedPeriod);

      const response = await fetch(`/api/pump-fun-combined?${queryParams.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setPools(data);
      }
    } catch (error) {
      console.error('Error applying filters:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D1F] text-white p-4 relative overflow-hidden">
      {/* Neon effect background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-blue-500/10" />
      <div className="absolute inset-0 backdrop-blur-3xl" />
      
      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
              Pump.fun Terminal
            </h1>
            <div className="h-6 w-[2px] bg-gradient-to-b from-purple-400 to-blue-400 animate-pulse" />
          </div>
          
          {/* Filter buttons */}
          <div className="flex gap-2">
            <FilterDialog onApplyFilters={handleApplyFilters} />
            <Button variant="outline" className="border-blue-400 hover:bg-blue-400/20">
              Sort
            </Button>
          </div>
        </div>

        {/* Period Selector with neon style */}
        <div className="mb-4">
          <Tabs defaultValue={selectedPeriod} onValueChange={setSelectedPeriod}>
            <TabsList className="bg-gray-800/50 backdrop-blur-lg border border-purple-400/20">
              <TabsTrigger value="5m" className="data-[state=active]:bg-purple-400/20">5M</TabsTrigger>
              <TabsTrigger value="15m" className="data-[state=active]:bg-purple-400/20">15M</TabsTrigger>
              <TabsTrigger value="30m" className="data-[state=active]:bg-purple-400/20">30M</TabsTrigger>
              <TabsTrigger value="1h" className="data-[state=active]:bg-purple-400/20">1H</TabsTrigger>
              <TabsTrigger value="6h" className="data-[state=active]:bg-purple-400/20">6H</TabsTrigger>
              <TabsTrigger value="24h" className="data-[state=active]:bg-purple-400/20">24H</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Table with terminal style */}
        <div className="overflow-x-auto rounded-lg border border-purple-400/20 backdrop-blur-lg">
          <table className="w-full min-w-[600px] md:min-w-[1200px]">
            <thead>
              <tr className="text-sm text-gray-400 border-b border-gray-800">
                <th className="px-4 py-2 text-left">#</th>
                <th className="px-4 py-2 text-left">POOL</th>
                <th className="px-4 py-2 text-right">PRICE</th>
                <th className="px-4 py-2 text-right">AGE</th>
                <th className="px-4 py-2 text-right">TXN</th>
                <th className="px-4 py-2 text-right">5M</th>
                <th className="px-4 py-2 text-right">1H</th>
                <th className="px-4 py-2 text-right">6H</th>
                <th className="px-4 py-2 text-right">24H</th>
                <th className="px-4 py-2 text-right">VOL</th>
                <th className="px-4 py-2 text-right">LIQ</th>
                <th className="px-4 py-2 text-right">MCAP/HLDR</th>
                <th className="px-4 py-2 text-right">FDV</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={13} className="text-center py-8">Loading...</td>
                </tr>
              ) : pools.map((pool, index) => (
                <tr key={pool.id} className="border-b border-gray-800 hover:bg-gray-800/30">
                  <td className="px-4 py-4">{index + 1}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 relative">
                        <Image
                          src={pool.imageUrl}
                          alt={pool.symbol}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <div className="font-medium">{pool.symbol}/SOL</div>
                        <div className="text-sm text-gray-400">{pool.name}</div>
                        <SocialLinks pool={pool} />
                        <SecurityScore security={pool.security} />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right">${parseFloat(pool.price).toFixed(7)}</td>
                  <td className="px-4 py-4 text-right">{formatAge(pool.age)}</td>
                  <td className="px-4 py-4 text-right">{pool.swapCount24h || '-'}</td>
                  <td className="px-4 py-4 text-right">{formatPercent(pool.changes['5m'])}</td>
                  <td className="px-4 py-4 text-right">{formatPercent(pool.changes['1h'])}</td>
                  <td className="px-4 py-4 text-right">{formatPercent(pool.changes['6h'])}</td>
                  <td className="px-4 py-4 text-right">{formatPercent(pool.changes['24h'])}</td>
                  <td className="px-4 py-4 text-right">{formatCurrency(pool.volume)}</td>
                  <td className="px-4 py-4 text-right">{formatCurrency(pool.liquidity)}</td>
                  <td className="px-4 py-4 text-right">{formatCurrency(pool.marketCapToHolder)}</td>
                  <td className="px-4 py-4 text-right">{formatCurrency(pool.fdv)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}