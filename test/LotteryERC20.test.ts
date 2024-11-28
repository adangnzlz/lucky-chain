import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, ContractFactory, Signer } from "ethers";
import { BigNumber } from "ethers"; // Asegúrate de esta importación

describe("LotterERC20 Contract", function () {
  let Lottery: ContractFactory;
  let lottery: Contract;
  let erc20Token: Contract;
  let vrfCoordinatorMock: Contract;
  let owner: Signer;
  let addr1: Signer;
  let addr2: Signer;
  let subscriptionId: number;
  let decimals: number;
  let ticketPrice: number;

  beforeEach(async function () {
    const LinkTokenMock = await ethers.getContractFactory("LinkTokenMock");
    erc20Token = await LinkTokenMock.deploy();
    await erc20Token.deployed();
    Lottery = await ethers.getContractFactory("LotteryERC20");
    [owner, addr1, addr2] = await ethers.getSigners();

    const VRFCoordinatorV2Mock = await ethers.getContractFactory(
      "VRFCoordinatorV2Mock"
    );
    vrfCoordinatorMock = await VRFCoordinatorV2Mock.deploy(0, 0);
    await vrfCoordinatorMock.deployed();

    const tx = await vrfCoordinatorMock.createSubscription();
    const receipt = await tx.wait();
    subscriptionId = receipt.events[0].args.subId;
    const keyHash = ethers.constants.HashZero; // Hash dummy

    lottery = await Lottery.deploy(
      subscriptionId,
      vrfCoordinatorMock.address,
      keyHash,
      erc20Token.address
    );
    await lottery.deployed();

    await vrfCoordinatorMock.addConsumer(subscriptionId, lottery.address);
    decimals = await lottery.getDecimals(erc20Token.address);
    const amount = ethers.utils.parseUnits("1", decimals); // 10 tokens
    const addr1Address = await addr1.getAddress();
    const addr2Address = await addr2.getAddress();

    await erc20Token.transfer(addr1Address, amount);
    await erc20Token.transfer(addr2Address, amount);

    await erc20Token.connect(addr1).approve(lottery.address, amount);
    await erc20Token.connect(addr2).approve(lottery.address, amount);
    ticketPrice = await lottery.lotteryTicket();
  });

  it("Should allow players to enter the lottery", async function () {
    const addr1Address = await addr1.getAddress();
    await lottery.connect(addr1).enter();
    const players: string[] = await lottery.getPlayers();
    expect(players).to.include(addr1Address);
  });

  it("Should deny players to enter the lottery if ticket ammount is not approved", async function () {
    const addr1Address = await addr1.getAddress();
    const newPrice = ethers.utils.parseUnits("2", decimals);
    await lottery.setLotteryTicket(newPrice);

    await expect(lottery.connect(addr1).enter()).to.be.revertedWith(
      "Token transfer failed"
    );
  });

  it("Should only allow the owner to pick the winner", async function () {
    await expect(lottery.connect(addr1).pickWinner()).to.be.revertedWith(
      "Only the manager can call this function"
    );
  });

  it("Should only allow the owner to pick the winner with enought subscription funds", async function () {
    await lottery.connect(addr1).enter();
    await lottery.connect(addr2).enter();
    // Selecciona un ganador
    await expect(lottery.connect(owner).pickWinner()).to.be.revertedWith(
      "Insufficient funds in the subscription"
    );
  });

  it("Should return correct decimals for the token", async function () {
    const decimals = await lottery.getDecimals(erc20Token.address);
    expect(decimals).to.equal(18); // Cambia según los decimales reales de tu token mock
  });

  it("The balance of winner should increase after claim the prize", async function () {
    const addr1Address = await addr1.getAddress();

    await lottery.connect(addr1).enter();
    await lottery.connect(addr2).enter();

    const fundAmount = ethers.utils.parseUnits("100", decimals); // 100 tokens
    await vrfCoordinatorMock.fundSubscription(subscriptionId, fundAmount);

    await lottery.connect(owner).pickWinner();
    await vrfCoordinatorMock.fulfillRandomWords(1, lottery.address);

    const winner = await lottery.recentWinner();
    let winnerAddr;
    if (addr1Address == winner) {
      winnerAddr = addr1;
    } else {
      winnerAddr = addr2;
    }
    const initialBalance = await erc20Token.balanceOf(winner);
    await lottery.connect(winnerAddr).withdrawPrize();
    const finalBalance = await erc20Token.balanceOf(winner);

    expect(finalBalance).to.be.eq(initialBalance.add(ticketPrice.mul(2)));
  });
});
