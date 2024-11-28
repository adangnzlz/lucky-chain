import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, ContractFactory, Signer } from "ethers";
import { assert } from "console";

describe("LotteryEther Contract", function () {
  let Lottery: ContractFactory;
  let lottery: Contract;
  let vrfCoordinatorMock: Contract;
  let owner: Signer;
  let addr1: Signer;
  let addr2: Signer;
  let addr3: Signer;
  let ticketPrice: number;

  beforeEach(async function () {
    Lottery = await ethers.getContractFactory("LotteryEther");
    [owner, addr1, addr2, addr3] = await ethers.getSigners();

    const VRFCoordinatorV2Mock = await ethers.getContractFactory(
      "VRFCoordinatorV2Mock"
    );
    vrfCoordinatorMock = await VRFCoordinatorV2Mock.deploy(0, 0);
    await vrfCoordinatorMock.deployed();
    const tx = await vrfCoordinatorMock.createSubscription();
    const receipt = await tx.wait();
    const subscriptionId = receipt.events[0].args.subId;

    const keyHash = ethers.constants.HashZero; // Hash dummy

    lottery = await Lottery.deploy(
      subscriptionId,
      vrfCoordinatorMock.address,
      keyHash,
      false
    );
    await lottery.deployed();
    await vrfCoordinatorMock.addConsumer(subscriptionId, lottery.address);
    ticketPrice = await lottery.lotteryTicket();
  });

  it("Direct transfers not allowed", async function () {
    await expect(
      addr1.sendTransaction({
        to: lottery.address,
        value: ethers.utils.parseEther("1"),
      })
    ).to.be.revertedWith("Direct transfers not allowed");
  });

  it("Only allow the owner to change the gas limit", async function () {
    // Selecciona un ganador
    await expect(lottery.connect(addr1).setGasLimit(90000)).to.be.revertedWith(
      "Only the manager can call this function"
    );

    await lottery.connect(owner).setGasLimit(230000);
    expect(await lottery.callbackGasLimit()).to.be.eq(230000);
  });

  it("Only allow the owner to change the lottery ticket", async function () {
    const newPrice = ethers.utils.parseEther("0.02");
    await expect(
      lottery.connect(addr1).setLotteryTicket(newPrice)
    ).to.be.revertedWith("Only the manager can call this function");

    await lottery.connect(owner).setLotteryTicket(newPrice);

    expect(await lottery.lotteryTicket()).to.equal(newPrice);

    await expect(
      lottery.connect(addr1).enter({ value: ethers.utils.parseEther("0.01") })
    ).to.be.revertedWith("Incorrect ticket ammount");

    await lottery.connect(addr1).enter({ value: newPrice });
    expect(await lottery.totalPlayerFunds()).to.be.eq(newPrice);
  });

  it("Should set the correct manager", async function () {
    const ownerAddress = await owner.getAddress();
    expect(await lottery.manager()).to.equal(ownerAddress);
  });

  it("Should allow players to enter the lottery", async function () {
    const addr1Address = await addr1.getAddress();

    await lottery.connect(addr1).enter({ value: ticketPrice });

    const players: string[] = await lottery.getPlayers();
    expect(players).to.include(addr1Address);
  });

  it("Should reject players who send incorrect ether amount", async function () {
    await expect(
      lottery.connect(addr2).enter({ value: ethers.utils.parseEther("0.02") })
    ).to.be.revertedWith("Incorrect ticket ammount");
  });

  it("Should only allow the owner to pick the winner", async function () {
    await expect(lottery.connect(addr1).pickWinner()).to.be.revertedWith(
      "Only the manager can call this function"
    );
  });

  it("Should revert if there is not two players at least in the lottery", async function () {
    await expect(lottery.connect(owner).pickWinner()).to.be.revertedWith(
      "No minimum players in the lottery"
    );
    await lottery.connect(addr1).enter({ value: ticketPrice });
    await expect(lottery.connect(owner).pickWinner()).to.be.revertedWith(
      "No minimum players in the lottery"
    );
  });

  it("The balance should increase after the player has entered", async function () {
    await lottery.connect(addr1).enter({ value: ticketPrice });
    await lottery.connect(addr2).enter({ value: ticketPrice });
    const lotteryBalance = await lottery.totalPlayerFunds();
    expect(lotteryBalance).to.be.equal(ticketPrice.mul(2));
  });

  it("Should pick a winner and let the balance available for him", async function () {
    await lottery.connect(addr1).enter({ value: ticketPrice });
    await lottery.connect(addr2).enter({ value: ticketPrice });

    await lottery.connect(owner).pickWinner();
    await vrfCoordinatorMock.fulfillRandomWords(1, lottery.address);

    const winner = await lottery.recentWinner();
    const winnerBalancePendingWithdrawal = await lottery.pendingWithdrawals(
      winner
    );

    expect(ticketPrice.mul(2)).to.be.equal(winnerBalancePendingWithdrawal);
  });

  it("The withdrawal balance for the winner must be 0 after claiming the prize.", async function () {
    const addr1Address = await addr1.getAddress();

    await lottery.connect(addr1).enter({ value: ticketPrice });
    await lottery.connect(addr2).enter({ value: ticketPrice });

    await lottery.connect(owner).pickWinner();
    await vrfCoordinatorMock.fulfillRandomWords(1, lottery.address);

    const winner = await lottery.recentWinner();
    let winnerAddr;
    if (addr1Address == winner) {
      winnerAddr = addr1;
    } else {
      winnerAddr = addr2;
    }
    await lottery.connect(winnerAddr).withdrawPrize();

    const winnerBalanceAfterWithdrawal = await lottery.pendingWithdrawals(
      winner
    );
    expect(winnerBalanceAfterWithdrawal).to.equal(0);
  });

  it("The balance of winner should increase after claim the prize", async function () {
    const addr1Address = await addr1.getAddress();

    await lottery.connect(addr1).enter({ value: ticketPrice });
    await lottery.connect(addr2).enter({ value: ticketPrice });
    await lottery.connect(owner).pickWinner();
    await vrfCoordinatorMock.fulfillRandomWords(1, lottery.address);

    const winner = await lottery.recentWinner();
    let winnerAddr;
    if (addr1Address == winner) {
      winnerAddr = addr1;
    } else {
      winnerAddr = addr2;
    }
    const initialBalance = await ethers.provider.getBalance(winner);
    await lottery.connect(winnerAddr).withdrawPrize();
    const finalBalance = await ethers.provider.getBalance(winner);

    expect(initialBalance).to.be.lt(finalBalance);
  });

  it("Remove players once winner picked", async function () {
    const addr1Address = await addr1.getAddress();

    await lottery.connect(addr1).enter({ value: ticketPrice });
    await lottery.connect(addr2).enter({ value: ticketPrice });
    await lottery.connect(addr3).enter({ value: ticketPrice });

    let playersRegistered = (await lottery.getPlayers()).length;

    expect(playersRegistered).to.be.eq(3);

    await lottery.connect(owner).pickWinner();
    await vrfCoordinatorMock.fulfillRandomWords(1, lottery.address);

    playersRegistered = (await lottery.getPlayers()).length;
    expect(playersRegistered).to.be.eq(0);
  });

  it("Lottery locked until winner claim the prize and open after claim", async function () {
    const addr1Address = await addr1.getAddress();

    await lottery.connect(addr1).enter({ value: ticketPrice });
    await lottery.connect(addr2).enter({ value: ticketPrice });

    let playersRegistered = (await lottery.getPlayers()).length;

    expect(playersRegistered).to.be.eq(2);

    await lottery.connect(owner).pickWinner();
    await vrfCoordinatorMock.fulfillRandomWords(1, lottery.address);

    playersRegistered = (await lottery.getPlayers()).length;
    expect(playersRegistered).to.be.eq(0);

    await expect(
      lottery.connect(addr3).enter({ value: ticketPrice })
    ).to.be.revertedWith("Winner pending to collect prize");

    const winner = await lottery.recentWinner();
    let winnerAddr;
    if (addr1Address == winner) {
      winnerAddr = addr1;
    } else {
      winnerAddr = addr2;
    }
    await lottery.connect(winnerAddr).withdrawPrize();

    await lottery.connect(addr3).enter({ value: ticketPrice });

    expect(1).to.be.eq((await lottery.getPlayers()).length);
  });
});
