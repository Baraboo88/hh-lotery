import { ethers } from "hardhat";

interface ChainModel{
    name: string;
    VRFCoordinator?: string;
    blockConfirmations?: number;
    entranceFee?: any;
    gasLane?: string;
    subscriptionId?: string;
    callBackGasLimit? : string;
    interval?: string;
}

export const networkConfig: {[id: number]: ChainModel} = {
    4: {
        name: 'rinkeby',
        VRFCoordinator: '0x6168499c0cFfCaCD319c818142124B7A15E857ab',
        blockConfirmations: 6,
        entranceFee:  ethers.utils.parseEther('0.01'),
        gasLane: '0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc',
        subscriptionId: '21133',
        callBackGasLimit: '500000',
        interval: '30'
    },
    31337:{
        name: 'hardhat',
        entranceFee: ethers.utils.parseEther('0.01'),
        gasLane: '0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc',
        callBackGasLimit: '500000',
        interval: '30'
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
