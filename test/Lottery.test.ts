import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, ContractFactory, Signer } from "ethers";

describe("Lottery Contract", function () {
  let Lottery: ContractFactory;
  let lottery: Contract;
  let vrfCoordinatorMock: Contract;
  let owner: Signer;
  let addr1: Signer;
  let addr2: Signer;
  let ticketPrice: number;

  beforeEach(async function () {
    Lottery = await ethers.getContractFactory("Lottery");
    [owner, addr1, addr2] = await ethers.getSigners();

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
      keyHash
    );
    await lottery.deployed();
    await vrfCoordinatorMock.addConsumer(subscriptionId, lottery.address);
    ticketPrice = await lottery.lotteryTicket();
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
    const contractBalance = await ethers.provider.getBalance(lottery.address);
    expect(contractBalance).to.equal(ticketPrice.mul(2));
  });

  it("Should pick a winner and transfer the balance", async function () {
    const addr1Address = await addr1.getAddress();
    const addr2Address = await addr2.getAddress();

    await lottery.connect(addr1).enter({ value: ticketPrice });
    await lottery.connect(addr2).enter({ value: ticketPrice });

    const addr1Balance = await ethers.provider.getBalance(addr1Address);
    const addr2Balance = await ethers.provider.getBalance(addr2Address);

    await lottery.connect(owner).pickWinner();
    await vrfCoordinatorMock.fulfillRandomWords(1, lottery.address);

    const contractBalance = await ethers.provider.getBalance(lottery.address);
    expect(contractBalance).to.equal(0);

    const finalBalance1 = await ethers.provider.getBalance(addr1Address);
    const finalBalance2 = await ethers.provider.getBalance(addr2Address);
    const expectedBalance1 = addr1Balance.add(ticketPrice.mul(2));
    const expectedBalance2 = addr2Balance.add(ticketPrice.mul(2));
    expect(
      finalBalance1.eq(expectedBalance1) ||
        finalBalance2.eq(expectedBalance2)
    ).to.be.true;
  });
});
