import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Cache for storing API responses with shorter duration
let apiCache: {
  [key: string]: {
    data: any;
    timestamp: number;
  };
} = {};

const CACHE_DURATION = 2000; 

async function fetchWithRetry(url: string, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://www.geckoterminal.com/'
        },
        cache: 'no-store'
      });

      // Handle Cloudflare challenge
      if (response.status === 403 || response.status === 503) {
        console.error(`Cloudflare challenge detected for ${url}`);
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
        continue;
      }

      // Handle rate limiting
      if (response.status === 429) {
        console.error(`Rate limit hit for ${url}`);
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i))); // Exponential backoff
        continue;
      }

      if (!response.ok) {
        throw new Error(`API error: ${response.status} for ${url}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Attempt ${i + 1} failed for ${url}:`, error);
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i))); // Exponential backoff
    }
  }
  throw new Error(`Failed after ${retries} retries`);
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

interface SocialLinks {
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
  socialLinks: SocialLinks;
  security: SecurityDetails;
  swapCount24h: number;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '24h';
    
    // Only use cache if explicitly requested
    const useCache = searchParams.get('cache') === 'true';
    const cacheKey = `pump-fun-${period}`;
    const now = Date.now();
    
    if (useCache && apiCache[cacheKey] && now - apiCache[cacheKey].timestamp < CACHE_DURATION) {
      return NextResponse.json(apiCache[cacheKey].data);
    }

    const baseUrl = 'https://app.geckoterminal.com/api/p1';
    const tagsUrl = `${baseUrl}/tags/pump-fun/pools?include=dex.network,tokens&sort=-${period}_trend_score`;

    try {
      const poolsData = await fetchWithRetry(tagsUrl);

      // Create token map
      const tokenMap = poolsData.included.reduce((acc: Record<string, any>, item: any) => {
        if (item.type === 'token') {
          acc[item.id] = item;
        }
        return acc;
      }, {});

      // Process pools in parallel batches
      const promises: Promise<any>[] = [];
      const BATCH_SIZE = 10;
      const DELAY_BETWEEN_BATCHES = 200;

      for (let i = 0; i < poolsData.data.length; i += BATCH_SIZE) {
        const batch = poolsData.data.slice(i, i + BATCH_SIZE);
        
        const batchPromises = batch.map(async (pool: any) => {
          const baseTokenId = pool.attributes.base_token_id;
          const baseToken = tokenMap[baseTokenId];
          const tokenData = pool.attributes.token_value_data[baseTokenId];
          const poolAddress = pool.attributes.address;

          try {
            // Fetch detailed pool data with a single API call
            const poolDetails = await fetchWithRetry(
              `https://app.geckoterminal.com/api/p1/solana/pools/${poolAddress}?include=dex%2Cdex.network.explorers%2Cdex_link_services%2Cnetwork_link_services%2Cpairs%2Ctoken_link_services%2Ctokens.token_security_metric%2Ctokens.tags%2Cpool_locked_liquidities&base_token=0`
            );

            const securityAttributes = poolDetails.data?.attributes;
            const networkLinkServices = poolDetails.included?.filter((item: any) => 
              item.type === 'network_link_service' && 
              ['RugCheck', 'SolSniffer', 'QuillCheck', 'GateKept'].includes(item.attributes.name)
            );

            const tokenInfo = poolDetails.included?.find((item: any) => 
              item.type === 'token' && item.attributes.address === baseToken?.attributes?.address
            );

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
              security: {
                gtScore: securityAttributes?.gt_score || 0,
                gtScoreDetails: {
                  info: securityAttributes?.gt_score_details?.info || 0,
                  pool: securityAttributes?.gt_score_details?.pool || 0,
                  transactions: securityAttributes?.gt_score_details?.transactions || 0,
                  holders: securityAttributes?.gt_score_details?.holders || 0,
                  creation: securityAttributes?.gt_score_details?.creation || 0,
                },
                lockedLiquidity: securityAttributes?.locked_liquidity ? {
                  locked_percent: securityAttributes.locked_liquidity.locked_percent,
                  next_unlock_timestamp: securityAttributes.locked_liquidity.next_unlock_timestamp,
                  final_unlock_timestamp: securityAttributes.locked_liquidity.final_unlock_timestamp,
                  source: securityAttributes.locked_liquidity.source,
                  url: securityAttributes.locked_liquidity.url
                } : null,
                sentimentVotes: {
                  total: securityAttributes?.sentiment_votes?.total || 0,
                  up_percentage: securityAttributes?.sentiment_votes?.up_percentage || 0,
                  down_percentage: securityAttributes?.sentiment_votes?.down_percentage || 0
                },
                securityLinks: networkLinkServices?.map((service: any) => ({
                  name: service.attributes.name,
                  category: service.attributes.category,
                  url: service.attributes.url,
                  image_url: service.attributes.image_url
                })) || []
              },
              socialLinks: {
                websites: tokenInfo?.attributes?.links?.websites || [],
                discord_url: tokenInfo?.attributes?.links?.discord_url,
                twitter_handle: tokenInfo?.attributes?.links?.twitter_handle,
                telegram_handle: tokenInfo?.attributes?.links?.telegram_handle,
                medium_handle: tokenInfo?.attributes?.links?.medium_handle,
                github_repo_name: tokenInfo?.attributes?.links?.github_repo_name,
                subreddit_handle: tokenInfo?.attributes?.links?.subreddit_handle,
                tiktok_handle: tokenInfo?.attributes?.links?.tiktok_handle,
                youtube_handle: tokenInfo?.attributes?.links?.youtube_handle,
                facebook_handle: tokenInfo?.attributes?.links?.facebook_handle,
                instagram_handle: tokenInfo?.attributes?.links?.instagram_handle,
                description: tokenInfo?.attributes?.description?.en || ''
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
      console.error('API fetch error:', error);
      // Return cached data if available, even if expired
      if (apiCache[cacheKey]) {
        console.log('Returning stale cache data');
        return NextResponse.json(apiCache[cacheKey].data);
      }
      throw error;
    }
  } catch (error) {
    console.error('Error in GET handler:', error);
    return NextResponse.json(
      { 
        error: 'Internal Server Error', 
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}