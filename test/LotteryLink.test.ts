import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, ContractFactory, Signer } from "ethers";
import { BigNumber } from "ethers"; // Asegúrate de esta importación

describe("LotteryLink Contract", function () {
  let Lottery: ContractFactory;
  let lottery: Contract;
  let linkToken: Contract;
  let vrfCoordinatorMock: Contract;
  let owner: Signer;
  let addr1: Signer;
  let addr2: Signer;
  let subscriptionId: number;
  let decimals: number;
  let ticketPrice: number;

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
    decimals = await lottery.getDecimals(linkToken.address);
    const amount = ethers.utils.parseUnits("10", decimals); // 10 tokens
    const addr1Address = await addr1.getAddress();
    const addr2Address = await addr2.getAddress();

    await linkToken.transfer(addr1Address, amount);
    await linkToken.transfer(addr2Address, amount);

    await linkToken.connect(addr1).approve(lottery.address, amount);
    await linkToken.connect(addr2).approve(lottery.address, amount);
    ticketPrice = await lottery.lotteryTicket();
  });

  it("Should set the correct manager", async function () {
    const ownerAddress = await owner.getAddress();
    expect(await lottery.manager()).to.equal(ownerAddress);
  });

  it("Should allow players to enter the lottery", async function () {
    const addr1Address = await addr1.getAddress();
    await lottery.connect(addr1).enter();
    const players: string[] = await lottery.getPlayers();
    expect(players).to.include(addr1Address);
  });

  it("Should only allow the owner to pick the winner", async function () {
    await expect(lottery.connect(addr1).pickWinner()).to.be.revertedWith(
      "Only the manager can call this function"
    );
  });

  it("Should revert if there are not at least two players in the lottery", async function () {
    await expect(lottery.connect(owner).pickWinner()).to.be.revertedWith(
      "No minimum players in the lottery"
    );
    await lottery.connect(addr1).enter();

    await expect(lottery.connect(owner).pickWinner()).to.be.revertedWith(
      "No minimum players in the lottery"
    );
  });

  it("The balance should increase after the player has entered", async function () {
    await lottery.connect(addr1).enter();
    await lottery.connect(addr2).enter();

    const contractBalance = await linkToken.balanceOf(lottery.address);
    const ticket = await lottery.lotteryTicket();
    expect(contractBalance).to.equal(ticket.mul(2));
  });

  /* it("Should pick a winner and transfer the token balance", async function () {
    const addr1InitialBalance = await linkToken.balanceOf(
      await addr1.getAddress()
    );
    const addr2InitialBalance = await linkToken.balanceOf(
      await addr2.getAddress()
    );

    await lottery.connect(addr1).enter();
    await lottery.connect(addr2).enter();
    const fundAmount = ethers.utils.parseUnits("100", decimals); // 100 tokens
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
    const ticket = await lottery.lotteryTicket();
    expect(
      addr1Balance.eq(addr1InitialBalance.add(ticket)) || // addr1 ganó los 20 tokens
        addr2Balance.eq(addr2InitialBalance.add(ticket)) // addr2 ganó los 20 tokens
    ).to.be.true;

    expect(
      addr1Balance.eq(addr1InitialBalance.sub(ticket)) || // addr1 ganó los 20 tokens
        addr2Balance.eq(addr2InitialBalance.sub(ticket)) // addr2 ganó los 20 tokens
    ).to.be.true;
  });*/

  it("Should pick a winner and let the balance available for him", async function () {
    await lottery.connect(addr1).enter();
    await lottery.connect(addr2).enter();
    const fundAmount = ethers.utils.parseUnits("100", decimals); // 100 tokens
    await vrfCoordinatorMock.fundSubscription(subscriptionId, fundAmount);

    await lottery.connect(owner).pickWinner();
    await vrfCoordinatorMock.fulfillRandomWords(1, lottery.address);

    const winner = await lottery.recentWinner();
    const winnerBalancePendingWithdrawal = await lottery.pendingWithdrawals(
      winner
    );

    expect(ticketPrice.mul(2)).to.equal(winnerBalancePendingWithdrawal);
  });
  it("The withdrawal balance for the winner must be 0 after claiming the prize.", async function () {
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
    const initialBalance = await ethers.provider.getBalance(winner);
    await lottery.connect(winnerAddr).withdrawPrize();
    const finalBalance = await ethers.provider.getBalance(winner);

    expect(initialBalance.lt(finalBalance));
  });

  it("Should only allow the owner to pick the winner with enought subscription funds", async function () {
    await lottery.connect(addr1).enter();
    await lottery.connect(addr2).enter();
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
  it("Only allow the owner to change the lottery ticket", async function () {
    // Selecciona un ganador
    const newTicket = ethers.utils.parseUnits("2", decimals);
    await expect(
      lottery.connect(addr1).setLotteryTicket(newTicket)
    ).to.be.revertedWith("Only the manager can call this function");
  });
});
