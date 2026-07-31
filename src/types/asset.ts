import type { AssetTypeKey, Liquidity } from "@/data/assetTypes";

export interface Asset {
  id: string;
  user_id: string;
  name: string;
  type: AssetTypeKey;
  liquidity: Liquidity;
  value: number;
  created_at: string;
}

export interface AssetInput {
  name: string;
  type: AssetTypeKey;
  liquidity: Liquidity;
  value: number;
}
