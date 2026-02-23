import { Account, ProviderInterface, CallData } from "starknet";

const OBOLUS_PERP_ADDRESS = process.env.NEXT_PUBLIC_PERP_CONTRACT || "";
const ORACLE_ADDRESS = process.env.NEXT_PUBLIC_ORACLE_CONTRACT || "";

export async function openPositionSealed(
  account: Account,
  ct_size: { L: string, R: string },
  ct_price: { L: string, R: string },
  collateral: bigint,
) {
  return account.execute([
    {
      contractAddress: OBOLUS_PERP_ADDRESS,
      entrypoint: "deposit_collateral",
      calldata: CallData.compile([collateral.toString()])
    },
    {
      contractAddress: OBOLUS_PERP_ADDRESS,
      entrypoint: "open_position_sealed",
      calldata: CallData.compile([
        ct_size.L,
        ct_size.R,
        ct_price.L,
        ct_price.R,
        collateral.toString()
      ])
    }
  ]);
}

export async function closePositionSealed(
  account: Account,
  positionId: number,
  ct_pnl: { L: string, R: string },
  proof: string[]
) {
  return account.execute([{
    contractAddress: OBOLUS_PERP_ADDRESS,
    entrypoint: "close_position_sealed",
    calldata: CallData.compile([
      positionId.toString(),
      ct_pnl.L,
      ct_pnl.R,
      proof
    ])
  }]);
}

export async function getPosition(provider: any, positionId: number) {
  return provider.callContract({
    contractAddress: OBOLUS_PERP_ADDRESS,
    entrypoint: "get_position",
    calldata: CallData.compile([positionId.toString()])
  });
}

export async function getMarkPrice(provider: any, assetId: string) {
  return provider.callContract({
    contractAddress: ORACLE_ADDRESS,
    entrypoint: "get_price",
    calldata: CallData.compile([assetId])
  });
}

export async function getPnL(provider: any, positionId: number): Promise<bigint> {
  const res = await provider.callContract({
    contractAddress: OBOLUS_PERP_ADDRESS,
    entrypoint: "get_pnl",
    calldata: CallData.compile([positionId.toString()])
  });
  return BigInt(res.result[0]);
}

export async function getCollateralBalance(provider: any, address: string): Promise<bigint> {
  const res = await provider.callContract({
    contractAddress: OBOLUS_PERP_ADDRESS,
    entrypoint: "get_collateral_balance",
    calldata: CallData.compile([address])
  });
  return BigInt(res.result[0]);
}

export function calculateLiquidationPrice(
  entryPrice: number,
  leverage: number,
  isLong: boolean,
  maintenanceMarginRatio: number = 0.05
): number {
  if (isLong) {
    return entryPrice * (1 - 1 / leverage + maintenanceMarginRatio);
  } else {
    return entryPrice * (1 + 1 / leverage - maintenanceMarginRatio);
  }
}
