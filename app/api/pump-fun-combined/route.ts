import { NextResponse } from 'next/server';

export const dynamic = 'force-static';
export const revalidate = 0;

// Cache for storing API responses
let apiCache: {
  [key: string]: {
    data: any;
    timestamp: number;
  };
} = {};

const CACHE_DURATION = 5000; // 5 seconds cache

async function fetchWithRetry(url: string, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        cache: 'no-store'
      });

      if (response.status === 429) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
        continue;
      }

      if (!response.ok) {
        throw new Error(`API error: ${response.status} for ${url}`);
      }

      return response.json();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
}

interface SocialLinks {
  websites: string[];
  discord_url: string | null;
  twitter_handle: string | null;
  telegram_handle: string | null;
  medium_handle: string | null;
  github_repo_name: string | null;
  subreddit_handle: string | null;
}

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
  };
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
  description: string;
  socialLinks: SocialLinks;
  security: SecurityDetails;
  swapCount24h: number;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '24h';

    // Check cache first
    const cacheKey = `pools_${period}`;
    const now = Date.now();
    if (apiCache[cacheKey] && now - apiCache[cacheKey].timestamp < CACHE_DURATION) {
      return NextResponse.json(apiCache[cacheKey].data);
    }

    // Batch process pools in smaller chunks
    const BATCH_SIZE = 10; // Increased batch size
    const DELAY_BETWEEN_BATCHES = 200; // Reduced delay

    // 1. Fetch initial pool data
    const poolsData = await fetchWithRetry(
      `https://app.geckoterminal.com/api/p1/tags/pump-fun/pools?page=1&include=dex.network%2Ctokens&sort=-${period}_trend_score`
    );

    // Create token map
    const tokenMap = poolsData.included.reduce((acc: Record<string, any>, item: any) => {
      if (item.type === 'token') {
        acc[item.id] = item;
      }
      return acc;
    }, {});

    // Process pools in parallel batches
    const combinedData: CombinedPoolData[] = [];
    const promises: Promise<any>[] = [];
    
    for (let i = 0; i < poolsData.data.length; i += BATCH_SIZE) {
      const batch = poolsData.data.slice(i, i + BATCH_SIZE);
      
      const batchPromises = batch.map(async (pool: any) => {
        const baseTokenId = pool.attributes.base_token_id;
        const baseToken = tokenMap[baseTokenId];
        const tokenData = pool.attributes.token_value_data[baseTokenId];
        const poolAddress = pool.attributes.address;

        try {
          // Fetch both token info and security details in parallel
          const [tokenInfoData, securityData] = await Promise.all([
            fetchWithRetry(
              `https://app.geckoterminal.com/api/p1/solana/pools/${poolAddress}/token_info_snapshots`
            ),
            fetchWithRetry(
              `https://app.geckoterminal.com/api/p1/solana/pools/${poolAddress}`
            )
          ]);

          const matchingToken = tokenInfoData.data.find(
            (token: any) => token.id === baseTokenId
          );

          const latestSnapshot = matchingToken?.attributes?.token_info_snapshots?.[0];
          const securityAttributes = securityData.data?.attributes;

          return {
            id: pool.id,
            baseTokenId: baseTokenId,
            name: baseToken?.attributes?.name || '',
            symbol: baseToken?.attributes?.symbol || '',
            imageUrl: baseToken?.attributes?.image_url || '',
            pumpAddress: baseToken?.attributes?.address || '',
            poolAddress: poolAddress,
            price: pool.attributes.price_in_usd,
            age: pool.attributes.pool_created_at,
            volume: pool.attributes.to_volume_in_usd,
            liquidity: pool.attributes.reserve_in_usd,
            marketCapToHolder: tokenData?.market_cap_to_holders_ratio || 0,
            fdv: tokenData?.fdv_in_usd || 0,
            changes: {
              '5m': pool.attributes.price_percent_changes.last_5m,
              '15m': pool.attributes.price_percent_changes.last_15m,
              '30m': pool.attributes.price_percent_changes.last_30m,
              '1h': pool.attributes.price_percent_changes.last_1h,
              '6h': pool.attributes.price_percent_changes.last_6h,
              '24h': pool.attributes.price_percent_changes.last_24h,
            },
            description: latestSnapshot?.description?.en || '',
            socialLinks: {
              websites: latestSnapshot?.links?.websites || [],
              discord_url: latestSnapshot?.links?.discord_url || null,
              twitter_handle: latestSnapshot?.links?.twitter_handle || null,
              telegram_handle: latestSnapshot?.links?.telegram_handle || null,
              medium_handle: latestSnapshot?.links?.medium_handle || null,
              github_repo_name: latestSnapshot?.links?.github_repo_name || null,
              subreddit_handle: latestSnapshot?.links?.subreddit_handle || null,
            },
            security: {
              gtScore: securityAttributes?.gt_score || 0,
              gtScoreDetails: {
                info: securityAttributes?.gt_score_details?.info || 0,
                pool: securityAttributes?.gt_score_details?.pool || 0,
                transactions: securityAttributes?.gt_score_details?.transactions || 0,
                holders: securityAttributes?.gt_score_details?.holders || 0,
                creation: securityAttributes?.gt_score_details?.creation || 0,
              },
              lockedLiquidity: {
                locked_percent: securityAttributes?.locked_liquidity?.locked_percent || 0,
                next_unlock_timestamp: securityAttributes?.locked_liquidity?.next_unlock_timestamp,
                final_unlock_timestamp: securityAttributes?.locked_liquidity?.final_unlock_timestamp,
              }
            },
            swapCount24h: pool.attributes.swap_count_24h || 0,
          };
        } catch (error) {
          console.error(`Error processing pool ${poolAddress}:`, error);
          return null;
        }
      });

      promises.push(...batchPromises);

      if (i + BATCH_SIZE < poolsData.data.length) {
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
      }
    }

    const results = await Promise.all(promises);
    const validResults = results.filter(Boolean);

    // Update cache
    apiCache[cacheKey] = {
      data: validResults,
      timestamp: now
    };

    return NextResponse.json(validResults);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch combined data' }, { status: 500 });
  }
}