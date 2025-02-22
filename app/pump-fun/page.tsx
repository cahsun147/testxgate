"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { formatDistanceToNow, differenceInDays } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FilterDialog } from "@/components/filter-dialog";
import { FaEye } from "react-icons/fa6";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  FaGlobe,
  FaTwitter,
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

interface SecurityDetails {
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
    source: string;
    url: string;
  } | null;
  sentimentVotes: {
    total: number;
    up_percentage: number;
    down_percentage: number;
  };
  securityLinks: {
    name: string;
    category: string;
    url: string;
    image_url: string;
  }[];
}

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
  security: SecurityDetails;
  socialLinks: {
    websites: string[];
    discord_url: string | null;
    twitter_handle: string | null;
    telegram_handle: string | null;
    medium_handle: string | null;
    github_repo_name: string | null;
    subreddit_handle: string | null;
    tiktok_handle: string | null;
    youtube_handle: string | null;
    facebook_handle: string | null;
    instagram_handle: string | null;
    description: string;
  };
  swapCount24h: number;
}

export default function PumpFun() {
  const [pools, setPools] = useState<CombinedPoolData[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState("24h");
  const [isLoading, setIsLoading] = useState(true);
  const previousDataRef = useRef<CombinedPoolData[]>([]);

  useEffect(() => {
    let isSubscribed = true;
    let timeoutId: NodeJS.Timeout;

    const fetchPools = async (isInitialLoad: boolean = false) => {
      try {
        // Only show loading on initial load when there's no data
        if (isInitialLoad && pools.length === 0) {
          setIsLoading(true);
        }

        const response = await fetch(`/api/pump-fun-combined?period=${selectedPeriod}`);
        if (!isSubscribed) return;
        
        if (response.ok) {
          const data = await response.json();
          if (!isSubscribed) return;

          // Store current data as previous before updating
          previousDataRef.current = pools;

          // Sort data based on selected period's change percentage
          const sortedData = data.sort((a: CombinedPoolData, b: CombinedPoolData) => {
            const aChange = parseFloat(a.changes[selectedPeriod as keyof typeof a.changes]);
            const bChange = parseFloat(b.changes[selectedPeriod as keyof typeof b.changes]);
            return bChange - aChange;
          });

          // Only update if we have valid new data
          if (sortedData && Array.isArray(sortedData) && sortedData.length > 0) {
            setPools(sortedData);
          } else if (previousDataRef.current.length > 0) {
            // If new data is invalid but we have previous data, keep showing it
            setPools(previousDataRef.current);
          }
        } else if (previousDataRef.current.length > 0) {
          // If request fails but we have previous data, keep showing it
          setPools(previousDataRef.current);
        }
      } catch (error) {
        console.error('Error fetching pools:', error);
        // On error, keep showing previous data if available
        if (previousDataRef.current.length > 0) {
          setPools(previousDataRef.current);
        }
      } finally {
        if (isSubscribed) {
          setIsLoading(false);
          // Schedule next update
          timeoutId = setTimeout(() => fetchPools(false), 15000);
        }
      }
    };

    // Start fetching
    fetchPools(true);

    // Cleanup function
    return () => {
      isSubscribed = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [selectedPeriod]);

  // Only show loading when there's no data at all
  const showLoading = isLoading && pools.length === 0 && previousDataRef.current.length === 0;

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
        <a href={`https://x.com/${pool.socialLinks.twitter_handle}`} target="_blank" rel="noopener noreferrer">
          <FaTwitter className="text-gray-400 hover:text-white" size={14} />
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

  const SecurityScore = ({ security }: { security: CombinedPoolData['security'] }) => {
    const [open, setOpen] = useState(false);

    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <FaEye className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Security Analysis</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">GT Score</h3>
              <div className="flex items-center gap-2">
                <div className={cn(
                  "text-lg font-semibold",
                  security.gtScore >= 7 ? "text-green-500" :
                  security.gtScore >= 4 ? "text-yellow-500" : "text-red-500"
                )}>
                  {security.gtScore.toFixed(1)}
                </div>
                <div className="text-sm text-gray-500">/ 10</div>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">Score Details</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Info: {security.gtScoreDetails.info}</div>
                <div>Pool: {security.gtScoreDetails.pool}</div>
                <div>Transactions: {security.gtScoreDetails.transactions}</div>
                <div>Holders: {security.gtScoreDetails.holders}</div>
                <div>Creation: {security.gtScoreDetails.creation}</div>
              </div>
            </div>

            {security.lockedLiquidity && (
              <div>
                <h3 className="font-medium mb-2">Liquidity Lock</h3>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span>Locked:</span>
                    <span className={cn(
                      "font-medium",
                      security.lockedLiquidity.locked_percent >= 80 ? "text-green-500" :
                      security.lockedLiquidity.locked_percent >= 50 ? "text-yellow-500" : "text-red-500"
                    )}>
                      {security.lockedLiquidity.locked_percent}%
                    </span>
                  </div>
                  {security.lockedLiquidity.next_unlock_timestamp && (
                    <div className="text-sm text-gray-600">
                      Next unlock: {new Date(security.lockedLiquidity.next_unlock_timestamp).toLocaleDateString()}
                    </div>
                  )}
                  {security.lockedLiquidity.url && (
                    <a href={security.lockedLiquidity.url} target="_blank" rel="noopener noreferrer" 
                      className="text-sm text-blue-500 hover:underline">
                      View on {security.lockedLiquidity.source}
                    </a>
                  )}
                </div>
              </div>
            )}

            {security.sentimentVotes.total > 0 && (
              <div>
                <h3 className="font-medium mb-2">Community Sentiment</h3>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-green-500">{security.sentimentVotes.up_percentage}% 👍</span>
                    <span className="text-red-500">{security.sentimentVotes.down_percentage}% 👎</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Based on {security.sentimentVotes.total} votes
                  </div>
                </div>
              </div>
            )}

            {security.securityLinks.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">Security Reports</h3>
                <div className="space-y-2">
                  {security.securityLinks.map((link, index) => (
                    <a key={index} href={link.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-500 hover:underline">
                      {link.image_url && (
                        <img src={link.image_url} alt={link.name} className="h-4 w-4" />
                      )}
                      {link.name}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  };

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
                <th className="px-4 py-2 text-left">Pool</th>
                <th className="px-4 py-2 text-center w-8"></th>
                <th className="px-4 py-2 text-right">Price</th>
                <th className="px-4 py-2 text-right">Age</th>
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
              {showLoading ? (
                <tr>
                  <td colSpan={13} className="text-center py-8">Loading...</td>
                </tr>
              ) : pools.length === 0 ? (
                <tr>
                  <td colSpan={13} className="text-center py-8">No data available</td>
                </tr>
              ) : (
                pools.map((pool, index) => (
                  <tr key={pool.id} className="border-b border-gray-800 hover:bg-gray-800/30">
                    <td className="px-4 py-4">{index + 1}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-8 h-8 flex-shrink-0">
                          <Image
                            src={pool.imageUrl || '/placeholder.png'}
                            alt={pool.name}
                            fill
                            className="rounded-full object-cover"
                            sizes="32px"
                            priority
                          />
                        </div>
                        <div className="flex flex-col">
                          <div className="font-medium">{pool.symbol}</div>
                          <div className="text-sm text-gray-400">{pool.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <SecurityScore security={pool.security} />
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}