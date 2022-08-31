import { HardhatRuntimeEnvironment } from "hardhat/types";
import { network } from "hardhat";
import { developmentChains, networkConfig } from "../helper-hardhat-config";
import { DeployFunction } from "hardhat-deploy/types";
import { verify } from "../utils/verify";

const FUND_AMOUNT = "1000000000000000000000";

const raffle: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  // @ts-ignore
  const { getNamedAccounts, deployments, network, ethers } = hre;
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;
  let vrfCoordinatorAddress, subscriptionId;

  if (developmentChains.includes(network.name)) {

    const vrfCoordinator = await ethers.getContract("VRFCoordinatorV2Mock");
    vrfCoordinatorAddress = vrfCoordinator.address;

    const tranctionResponse = await vrfCoordinator.createSubscription();
    const tranctionReceipt = await tranctionResponse.wait();

    subscriptionId = tranctionReceipt.events[0].args.subId;

   
    await vrfCoordinator.fundSubscription(subscriptionId, FUND_AMOUNT);
  } else {
    vrfCoordinatorAddress = networkConfig[chainId!]["VRFCoordinator"];
    subscriptionId = networkConfig[chainId!]["subscriptionId"];
  }
  const entranceFee = networkConfig[chainId!]["entranceFee"];
  const gasLane = networkConfig[chainId!]["gasLane"];
  const callBackGasLimit = networkConfig[chainId!]["callBackGasLimit"];
  const interval = networkConfig[chainId!]["interval"];

  const args = [
    vrfCoordinatorAddress,
    entranceFee,
    gasLane,
    subscriptionId,
    callBackGasLimit,
    interval,
  ];

  const raffle = await deploy("Raffle", {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: networkConfig[chainId!]
      ? networkConfig[chainId!].blockConfirmations
      : 0,
  });

  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    await verify(raffle.address, args);
  }

  log("-------------------------------------");
};

export default raffle;

raffle.tags = ["all", "raffle"];