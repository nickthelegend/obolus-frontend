export const NETWORKS = {
    devnet: {
        name: "Starknet Devnet",
        rpcUrl: process.env.NEXT_PUBLIC_STARKNET_RPC || "http://127.0.0.1:5050/rpc",
        explorerUrl: "https://starkscan.co",
        tokens: {
            ETH: {
                symbol: "ETH",
                name: "Ethereum",
                decimals: 18,
                erc20: "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
                tongo: "0x0780a518676df056370fb89c9751559b67a017e72c75c4cd899b689a6474fc52",
                rate: 3000000000000n,
            },
            USDC: {
                symbol: "USDC",
                name: "USD Coin",
                decimals: 6,
                erc20: "0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8",
                tongo: "0x0311a1eb7f0822233b1fdbbb70768aa6d8d1705150e64996bc182337366c2ec3",
                rate: 10000n,
            },
            STRK: {
                symbol: "STRK",
                name: "Starknet Token",
                decimals: 18,
                erc20: "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
                tongo: "0x0426a7b806a884744474d0a517c92dd961120102f7c0b967411d91dc6714be16",
                rate: 50000000000000000n,
            },
            WBTC: {
                symbol: "WBTC",
                name: "Wrapped Bitcoin",
                decimals: 8,
                erc20: "0x03fe2b97c1fd33f07960814c90498525b4ec6fdbf4192d121b1920230232145",
                tongo: "0x01b826429cfb507586af09c6f5dc44d99043945d7af272141c2e677aab8777ae",
                rate: 1000n,
            },
            LORDS: {
                symbol: "LORDS",
                name: "Lords",
                decimals: 18,
                erc20: "0x0124aeb495b947267a85e23e6b1d091d4e7ca2a5f1c3d1d2b591b6e4d6fadb32",
                tongo: "0x037d4de4cd919ccf612b441a76661c3afdc9a990791c4e56a3a0879218053eee",
                rate: 1000000000000000000n,
            },
        },
    },
} as const;

export type TokenSymbol = "ETH" | "USDC" | "STRK" | "WBTC" | "LORDS";
export type TokenConfig = (typeof NETWORKS.devnet.tokens)[TokenSymbol];

export const TONGO_CLASS_HASH = "0x00582609087e5aeb75dc25284cf954e2cee6974568d1b5636052a9d36eec672a";

// Obolus-specific contracts (to be deployed)
export const OBOLUS_ENCRYPTION_CONTRACTS = {
    Oracle: "0x07a1f43735c93255a909fc4c89c14df964189939bac1215b3ffe9d6fcf0138e4",
    Collateral: "0x0407df5f260660fddbafb0196c1d91617cc11dcd330e7bcf4a9a37d13bea36f2",
    Perp: "0x05a28d64932de8eb4908f0f1078e1e9388526655e19c7da1de659ebc165662fc",
    ViewingKey: "0x020dfcbfae7733cc4c85212da250f4dea62beb549fa0e3ca5a14d4cd6e6d6f48",
    SealedOrderbook: "0x061acf5717f4e8801f60bd9ae7afbb28bab62cf62eaa59b16010f55fac0183ab",
    ShadowPool: "0x0552d242093ea8d558a137bb67fa7ff21df79dadc0d6d5caadc2b99b74f7ad4b",
    ConfidentialToken: "0x0780a518676df056370fb89c9751559b67a017e72c75c4cd899b689a6474fc52", // ETH instance as default
} as const;

export const getNetwork = () => NETWORKS.devnet;
export const getToken = (symbol: TokenSymbol) => NETWORKS.devnet.tokens[symbol];
export const getExplorerTxUrl = (hash: string) => `${NETWORKS.devnet.explorerUrl}/tx/${hash}`;
export const getExplorerContractUrl = (addr: string) => `${NETWORKS.devnet.explorerUrl}/contract/${addr}`;
