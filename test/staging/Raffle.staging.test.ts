import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { assert, expect } from "chai";
import { BigNumber } from "ethers";
import { ethers, network } from "hardhat";
import { developmentChains } from "../../helper-hardhat-config";
import { Raffle } from "../../typechain-types";

developmentChains.includes(network.name)
  ? describe.skip
  : describe("Raffle", () => {
      let raffle: Raffle;

      let deployer: SignerWithAddress;
      let raffleEntaranceFee: BigNumber;

      beforeEach(async () => {
        const accounts = await ethers.getSigners();
        deployer = accounts[0];
        raffle = await ethers.getContract("Raffle");
        raffleEntaranceFee = await raffle.getEntranceFee();
      });

      describe("fulfillRandomWords", () => {
        it("works with live chainlink keeper and chainlink VRF, we get a random winner", async () => {
          //enter raffle

          const startingTimeStamp = await raffle.getLatestTimeStamp();
          const accounts = await ethers.getSigners();
          await new Promise<void>(async (resolve, reject) => {
            raffle.once("WinnerPicked", async () => {
                console.log('Setting up test...')
              // assert throws an error if it fails, so we need to wrap
              // it in a try/catch so that the promise returns event
              // if it fails.
              try {
                // // Now lets get the ending values...
                const recentWinner = await raffle.getRecentWinner();
                const raffleState = await raffle.getRaffleState();
                const winnerBalance = await accounts[0].getBalance();
                const endingTimeStamp = await raffle.getLatestTimeStamp();
                await expect(raffle.getPlayer(0)).to.be.reverted;
                assert.equal(recentWinner.toString(), accounts[0].address);
                assert.equal(raffleState, 0);
                //
                assert.equal(
                  winnerBalance.toString(),
                  startingBalance.add(raffleEntaranceFee).toString()
                );
                assert(endingTimeStamp > startingTimeStamp);
                resolve();
              } catch (e) {
                reject(e);
              }
              // then entering ther raffle
            
            });
            console.log('Entering Raffle...')
            const tx = await raffle.enterRaffle({ value: raffleEntaranceFee });
            await tx.wait(1)
			console.log('Ok, time to wait...')
            const startingBalance = await accounts[0].getBalance();
          });
        });
      });
    });
