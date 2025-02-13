export interface CoinData {
  id: string;
  name: string;
  symbol: string;
  image: string;
  current_price: number;
  market_cap: number;
  price_change_percentage_24h: number;
  total_volume: number;
}

export interface TokenData {
  id: string;
  type: string;
  attributes: {
    name: string;
    symbol: string;
    address: string;
    image_url: string;
  }
}

export interface PoolData {
  id: string;
  type: string;
  attributes: {
    name: string;
    price_in_usd: string;
    price_percent_changes: {
      last_5m: string;
      last_1h: string;
      last_6h: string;
      last_24h: string;
    };
    swap_count_24h: number;
    reserve_in_usd: string;
    base_token_id: string;
  };
  relationships: {
    tokens: {
      data: Array<{
        id: string;
        type: string;
      }>;
    };
  };
}

export interface PumpFunResponse {
  data: PoolData[];
  included: TokenData[];
}