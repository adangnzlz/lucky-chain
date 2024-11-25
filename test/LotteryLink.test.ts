import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, ContractFactory, Signer } from "ethers";

describe("LotteryLink Contract", function () {
  let Lottery: ContractFactory;
  let lottery: Contract;
  let linkToken: Contract;
  let vrfCoordinatorMock: Contract;
  let owner: Signer;
  let addr1: Signer;
  let addr2: Signer;
  let subscriptionId: number;

  beforeEach(async function () {
    const LinkTokenMock = await ethers.getContractFactory("LinkTokenMock");
    linkToken = await LinkTokenMock.deploy();
    await linkToken.deployed();
    Lottery = await ethers.getContractFactory("LotteryLink");
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
      linkToken.address
    );
    await lottery.deployed();

    await vrfCoordinatorMock.addConsumer(subscriptionId, lottery.address);

    const amount = ethers.utils.parseUnits("10", 18); // 10 tokens
    const addr1Address = await addr1.getAddress();
    const addr2Address = await addr2.getAddress();

    await linkToken.transfer(addr1Address, amount);
    await linkToken.transfer(addr2Address, amount);

    await linkToken.connect(addr1).approve(lottery.address, amount);
    await linkToken.connect(addr2).approve(lottery.address, amount);    
  });

  it("Should set the correct manager", async function () {
    const ownerAddress = await owner.getAddress();
    expect(await lottery.manager()).to.equal(ownerAddress);
  });

  it("Should allow players to enter the lottery", async function () {
    const addr1Address = await addr1.getAddress();

    const amount = ethers.utils.parseUnits("10", 18);

    await lottery.connect(addr1).enter(amount);
    const players: string[] = await lottery.getPlayers();
    expect(players).to.include(addr1Address);
  });

  it("Should reject players who send less than 1 link", async function () {
    const addr2Address = await addr2.getAddress();
    const amount = ethers.utils.parseUnits("0.5", 18);

    await expect(lottery.connect(addr2).enter(amount)).to.be.revertedWith(
      "Minimum amount not met"
    );
  });

  it("Should only allow the owner to pick the winner", async function () {
    await expect(lottery.connect(addr1).pickWinner()).to.be.revertedWith(
      "Only the manager can call this function"
    );
  });

  it("Should revert if there are not at least two players in the lottery", async function () {
    const amount = ethers.utils.parseUnits("1", 18);
    await expect(lottery.connect(owner).pickWinner()).to.be.revertedWith(
      "No minimum players in the lottery"
    );

    await lottery.connect(addr1).enter(amount);

    await expect(lottery.connect(owner).pickWinner()).to.be.revertedWith(
      "No minimum players in the lottery"
    );
  });

  it("The balance should increase after the player has entered", async function () {
    const amount = ethers.utils.parseUnits("1", 18);

    await lottery.connect(addr1).enter(amount);
    await lottery.connect(addr2).enter(amount);

    const contractBalance = await linkToken.balanceOf(lottery.address);
    expect(contractBalance).to.equal(ethers.utils.parseUnits("2", 18));
  });

  it("Should pick a winner and transfer the token balance", async function () {
    const amount = ethers.utils.parseUnits("10", 18); // 10 tokens

    await lottery.connect(addr1).enter(amount);
    await lottery.connect(addr2).enter(amount);
    const fundAmount = ethers.utils.parseUnits("100", 18); // 100 tokens
    await vrfCoordinatorMock.fundSubscription(subscriptionId, fundAmount);

    // Selecciona un ganador
    await lottery.connect(owner).pickWinner();

    // Simula la respuesta del VRF
    await vrfCoordinatorMock.fulfillRandomWords(1, lottery.address);

    // Verifica que el balance del contrato sea 0 después de transferir los tokens al ganador
    const contractBalance = await linkToken.balanceOf(lottery.address);
    expect(contractBalance).to.equal(0);

    // Verifica que uno de los jugadores haya recibido los tokens
    const addr1Balance = await linkToken.balanceOf(await addr1.getAddress());
    const addr2Balance = await linkToken.balanceOf(await addr2.getAddress());

    expect(
      addr1Balance.gt(ethers.utils.parseUnits("19", 18)) || // addr1 ganó los 20 tokens
        addr2Balance.gt(ethers.utils.parseUnits("19", 18)) // addr2 ganó los 20 tokens
    ).to.be.true;
  });


  it("Should only allow the owner to pick the winner with enought subscription funds", async function () {
    const amount = ethers.utils.parseUnits("10", 18); // 10 tokens

    await lottery.connect(addr1).enter(amount);
    await lottery.connect(addr2).enter(amount);

    // Selecciona un ganador
    await expect(lottery.connect(owner).pickWinner()).to.be.revertedWith(
      "Insufficient funds in the subscription"
    );

  });


  it("Only allow the owner to change the gas limit", async function () {
    // Selecciona un ganador
    await expect(lottery.connect(addr1).setGasLimit(90000)).to.be.revertedWith(
      "Only the manager can call this function"
    );

  });
});
