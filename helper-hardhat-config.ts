import { ethers } from "hardhat";

interface ChainModel{
    name: string;
    VRFCoordinator?: string;
    blockConfirmations?: number;
    entranceFee?: any
}

export const networkConfig: {[id: number]: ChainModel} = {
    4: {
        name: 'rinkeby',
        VRFCoordinator: '0x6168499c0cFfCaCD319c818142124B7A15E857ab',
        blockConfirmations: 6,
        entranceFee:  ethers.utils.parseEther('0.1')
    },
    31337:{
        name: 'hardhat',
        entranceFee: ethers.utils.parseEther('0.1')
    },
    137: {
        name: "poligon",
    }
}


export const BASE_FEE = ethers.utils.parseEther('0.25'); // 0.25 is the premium. It consts 0.25 LINK Per request

export const GAS_PRICE_LINK = 1e9;  //calculated value based on the gas price of the chain

export const developmentChains = ["hardhat", "localhost"]
export const DECIMALS = "18";
export const INITIAL_ANSWER = "1000000000000000000000";
