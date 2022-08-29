
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { network } from "hardhat";
import { developmentChains, networkConfig } from "../helper-hardhat-config";
import { DeployFunction } from "hardhat-deploy/types";
import { verify } from "../utils/verify";

const fundMe: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    // @ts-ignore
    const { getNamedAccounts, deployments, network } = hre;
    const { deploy, log, get } = deployments;
    const { deployer } = await getNamedAccounts();
    const chainId = network.config.chainId;
    let vrfCoordinatorAddress;

    if (developmentChains.includes(network.name)) {
        const vrfCoordinator = await get("VRFCoordinatorV2Mock");
        vrfCoordinatorAddress = vrfCoordinator.address;
    } else {
        vrfCoordinatorAddress = networkConfig[chainId!]["VRFCoordinator"];
    }
    const args = [vrfCoordinatorAddress];
    
    const fundMe = await deploy("Raffle", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: networkConfig[chainId!] ? networkConfig[chainId!].blockConfirmations : 0,
    });

    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {

        await verify(fundMe.address, args);
    }

    log("-------------------------------------");
};

export default fundMe;

fundMe.tags = ["all", "fundme"];