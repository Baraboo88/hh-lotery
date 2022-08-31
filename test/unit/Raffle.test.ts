import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { assert, expect } from "chai";
import { BigNumber } from "ethers";
import { deployments, ethers, network } from "hardhat";
import { developmentChains, networkConfig } from "../../helper-hardhat-config";
import { Raffle, VRFCoordinatorV2Mock } from "../../typechain-types";

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("Raffle", () => {
      let raffle: Raffle;
      let raffleContract: Raffle;
      let deployer: SignerWithAddress;
      let vrfCoordinatorV2Mock: VRFCoordinatorV2Mock;
      let raffleEntaranceFee: BigNumber;
      let interval: BigNumber;
      const chainId = network.config.chainId;

      beforeEach(async () => {
        const accounts = await ethers.getSigners();
        deployer = accounts[0];
        await deployments.fixture(["mocks", "raffle"]);
        raffleContract = await ethers.getContract("Raffle");
        raffle = raffleContract.connect(deployer);
        vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock");
        raffleEntaranceFee = await raffle.getEntranceFee();
        interval = await raffle.getInterval();
      });

      describe("consturctor", () => {
        it("should be able to create a raffle", async () => {
          //Ideally we make our test have just 1 assert per it

          const raffleState = await raffle.getRaffleState();
          const interval = await raffle.getInterval();
          assert.equal(raffleState.toString(), "0");
          assert.equal(
            interval.toString(),
            networkConfig[chainId!]["interval"]
          );
        });
      });

      describe("enterRaffle", () => {
        it("revert when you dont have pay enough", async () => {
          await expect(raffle.enterRaffle()).to.be.revertedWith(
            "Raffle__NotEnoughEthEntered"
          );
        });
        it("records players when entered raffle", async () => {
          //raffleEntaranceFee
          await raffle.enterRaffle({ value: raffleEntaranceFee });
          const playerFromContract = await raffle.getPlayer(0);
          assert.equal(playerFromContract, deployer.address);
        });
        it("emits event on enter", async () => {
          await expect(
            raffle.enterRaffle({ value: raffleEntaranceFee })
          ).to.emit(raffle, "RaffleEnter");
        });

        it("doest allow entrace when raffle is calculating", async () => {
          await raffle.enterRaffle({ value: raffleEntaranceFee });
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ]);
          await network.provider.send("evm_mine", []);
          // we pretend to be a chanilink keeper
          await raffle.performUpkeep([]);
          await expect(
            raffle.enterRaffle({ value: raffleEntaranceFee })
          ).to.be.revertedWith("Raffle__NotOpen");
        });
      });

      describe("checkUpkeep", () => {
        it("returns false if people havent sent any ETH", async () => {
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ]);
          await network.provider.send("evm_mine", []);
          const { upkeepNeeded } = await raffle.callStatic.checkUpkeep([]);
          assert(!upkeepNeeded);
        });

        it("returns false if raffle ist open", async () => {
          await raffle.enterRaffle({ value: raffleEntaranceFee });
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ]);
          await network.provider.send("evm_mine", []);
          await raffle.performUpkeep([]);
          const raffleState = await raffle.getRaffleState();
          const { upkeepNeeded } = await raffle.callStatic.checkUpkeep([]);

          assert.equal(raffleState.toString(), "1");
          assert.equal(upkeepNeeded, false);
        });

        it("returns false if enough time hasn't passed", async () => {
          await raffle.enterRaffle({ value: raffleEntaranceFee });
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() - 1,
          ]);
          await network.provider.request({ method: "evm_mine", params: [] });
          const { upkeepNeeded } = await raffle.callStatic.checkUpkeep("0x");
          assert(!upkeepNeeded);
        });
        it("returns true if enough time has passed, has players, eth, and is open", async () => {
          await raffle.enterRaffle({ value: raffleEntaranceFee });
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ]);
          await network.provider.request({ method: "evm_mine", params: [] });
          const { upkeepNeeded } = await raffle.callStatic.checkUpkeep("0x");
          assert(upkeepNeeded);
        });
      });

      describe("performUpkeep", () => {
        it("it can only run if checkUpkeep is true", async () => {
          await raffle.enterRaffle({ value: raffleEntaranceFee });
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ]);
          await network.provider.send("evm_mine", []);
          const tx = await raffle.performUpkeep([]);
          assert(tx);
        });

        it("revert when checkUpkeep is false", async () => {
          await expect(raffle.performUpkeep([])).to.be.revertedWith(
            "Raffle_UpkeepNotNeeded"
          );
        });
        it("updates the raffle state and emits a requestId", async () => {
          // Too many asserts in this test!
          await raffle.enterRaffle({ value: raffleEntaranceFee });
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ]);
          await network.provider.request({ method: "evm_mine", params: [] });
          const txResponse = await raffle.performUpkeep("0x");
          const txReceipt = await txResponse.wait(1);
          const raffleState = await raffle.getRaffleState();
          const requestId = txReceipt!.events![1].args!.requestId;
          assert(requestId.toNumber() > 0);
          assert(raffleState == 1);
        });
      });

      describe("fulfillRandomWords", () => {
        beforeEach(async () => {
          await raffle.enterRaffle({ value: raffleEntaranceFee });
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ]);
          await network.provider.send("evm_mine", []);
        });

        it("can only be called after performupkeep", async () => {

          await expect(
            vrfCoordinatorV2Mock.fulfillRandomWords(0, raffle.address)
          ).to.be.revertedWith("nonexistent request");
          await expect(
            vrfCoordinatorV2Mock.fulfillRandomWords(1, raffle.address)
          ).to.be.revertedWith("nonexistent request");
        });

        it("picks a winner, resets, and sends money", async () => {
          const additionalEntrances = 3;
          const startingIndex = 2;
          const accounts = await ethers.getSigners();
          for (
            let i = startingIndex;
            i < startingIndex + additionalEntrances;
            i++
          ) {
            // const accountConnectedRaffle = raffle.connect(accounts[i]);

            // await accountConnectedRaffle.enterRaffle({
            //   value: raffleEntaranceFee,
            // });

            raffle = raffleContract.connect(accounts[i]);
            await raffle.enterRaffle({ value: raffleEntaranceFee });
          }
          const startingTimeStamp = await raffle.getLatestTimeStamp();

          // This will be more important for our staging tests...
          await new Promise<void>(async (resolve, reject) => {
            raffle.once("WinnerPicked", async () => {
              console.log("WinnerPicked event fired!");
              // assert throws an error if it fails, so we need to wrap
              // it in a try/catch so that the promise returns event
              // if it fails.
              try {
                // Now lets get the ending values...
                const recentWinner = await raffle.getRecentWinner();
                const raffleState = await raffle.getRaffleState();
                const winnerBalance = await accounts[2].getBalance();
                const endingTimeStamp = await raffle.getLatestTimeStamp();
                await expect(raffle.getPlayer(0)).to.be.reverted;
                assert.equal(recentWinner.toString(), accounts[2].address);
                assert.equal(raffleState, 0);
                //
                assert.equal(
                  winnerBalance.toString(),
                  startingBalance
                    .add(
                      raffleEntaranceFee
                        .mul(additionalEntrances)
                        .add(raffleEntaranceFee)
                    )
                    .toString()
                );
                assert(endingTimeStamp > startingTimeStamp);
                resolve();
              } catch (e) {
                reject(e);
              }
            });

            const tx = await raffle.performUpkeep([]);
            const txReceipt = await tx.wait(1);
            const startingBalance = await accounts[2].getBalance();
            await vrfCoordinatorV2Mock.fulfillRandomWords(
              txReceipt!.events![1].args!.requestId,
              raffle.address
            );
          });
        });
      });
    });
