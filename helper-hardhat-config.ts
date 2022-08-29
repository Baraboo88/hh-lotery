
interface ChainModel{
    name: string;
    ethUsdPriceFeed: string;
    blockConfirmations?: number;
}

export const networkConfig: {[id: number]: ChainModel} = {
    4: {
        name: 'rinkeby',
        ethUsdPriceFeed: '0x8A753747A1Fa494EC906cE90E9f37563A8AF630e',
        blockConfirmations: 6,
    },
    137: {
        name: "poligon",
        ethUsdPriceFeed: ''
    }
}

export const developmentChains = ["hardhat", "localhost"]
export const DECIMALS = "18";
export const INITIAL_ANSWER = "1000000000000000000000";
