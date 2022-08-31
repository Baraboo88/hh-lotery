import { HardhatRuntimeEnvironment } from "hardhat/types";
import { developmentChains, networkConfig } from "../helper-hardhat-config";
import { DeployFunction } from "hardhat-deploy/types";
import { GAS_PRICE_LINK, BASE_FEE } from "../helper-hardhat-config";

const deployMocks: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
  // @ts-ignore
  const { getNamedAccounts, deployments, network } = hre;
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();

  if (developmentChains.includes(network.name)) {
    log("Local network detected! Deploying mocks...");
    await deploy("VRFCoordinatorV2Mock", {
      from: deployer,
      log: true,
      args: [BASE_FEE, GAS_PRICE_LINK],
    });
    log("Mocks deployed!");
    log("----------------------------------------------");
  }
};

export default deployMocks;

deployMocks.tags = ["all", "mocks"];
