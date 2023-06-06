const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");

describe("CharityPlatform", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;

    const Factory = await ethers.getContractFactory("CharityPlatform");
    const contract = await Factory.deploy();

    const fundingGoal = ethers.utils.parseEther("100");
    const deadline = (await time.latest()) + ONE_YEAR_IN_SECS;

    await contract.createCharity("Test", "TestDescr", fundingGoal, deadline);

    const donationValue = ethers.utils.parseEther("1");

    return {
      contract,
      donationValue,
      fundingGoal,
      owner,
      otherAccount,
      deadline,
    };
  }

  describe("Donation", function () {
    it("Should increase charity funding raised", async function () {
      const { contract, otherAccount, donationValue } = await loadFixture(
        deployFixture
      );

      await contract.connect(otherAccount).donate(0, { value: donationValue });

      const charity = await contract.charities(0);

      expect(await charity.fundingRaised.toString()).to.equal(donationValue);
    });

    it("Should increase donations for user", async function () {
      const { contract, donationValue, otherAccount } = await loadFixture(
        deployFixture
      );

      await contract.connect(otherAccount).donate(0, { value: donationValue });

      const donation = await contract.donations(0, otherAccount.address);
      expect(await donation.toString()).to.equal(donationValue);
    });

    it("Should receive and store the funds", async function () {
      const { contract, otherAccount, donationValue } = await loadFixture(
        deployFixture
      );

      await contract.connect(otherAccount).donate(0, { value: donationValue });

      expect(await ethers.provider.getBalance(contract.address)).to.equal(
        donationValue
      );
    });

    describe("Validations", function () {
      it("Should fail if charity deadline has passed", async function () {
        const { contract, otherAccount, donationValue, deadline } =
          await loadFixture(deployFixture);

        await time.increaseTo(deadline);

        expect(
          contract.connect(otherAccount).donate(0, { value: donationValue })
        ).to.be.revertedWith("Deadline passed");
      });

      it("Should fail if charity funding goal has been reached", async function () {
        const { contract, otherAccount, donationValue, fundingGoal } =
          await loadFixture(deployFixture);

        await contract.connect(otherAccount).donate(0, { value: fundingGoal });

        await expect(
          contract.connect(otherAccount).donate(0, { value: donationValue })
        ).to.be.revertedWith("Funds raised");
      });

      it("Should fail if donation exceeds funding goal", async function () {
        const { contract, otherAccount, donationValue, fundingGoal } =
          await loadFixture(deployFixture);

        await contract
          .connect(otherAccount)
          .donate(0, { value: donationValue });

        await expect(
          contract.connect(otherAccount).donate(0, { value: fundingGoal })
        ).to.be.revertedWith("Cannot exceed funding goal");
      });
    });

    describe("Events", function () {
      it("Should emit an event on donation", async function () {
        const { contract, otherAccount, donationValue } = await loadFixture(
          deployFixture
        );

        expect(
          contract.connect(otherAccount).donate(0, { value: donationValue })
        )
          .to.emit(contract, "DonationMade")
          .withArgs(0, otherAccount.address, donationValue);
      });
    });
  });

  describe("CollectFunds", function () {
    describe("Validations", function () {
      it("Should fail if charity deadline has not passed yet and funding goal is not reached yet", async function () {
        const { owner, contract } = await loadFixture(deployFixture);

        await expect(
          contract.collectFunds(0, owner.address)
        ).to.be.revertedWith("Charity is active");
      });

      it("Should fail if the caller is not the charity creator", async function () {
        const { contract, otherAccount, deadline } = await loadFixture(
          deployFixture
        );

        await time.increaseTo(deadline);

        expect(
          contract.connect(otherAccount).collectFunds(0, otherAccount.address)
        ).to.be.revertedWith("Not the creator");
      });

      it("Should fail if the caller already collected the raised funds", async function () {
        const { contract, owner, deadline } = await loadFixture(deployFixture);

        await time.increaseTo(deadline);
        await contract.collectFunds(0, owner.address);

        expect(contract.collectFunds(0, owner.address)).to.be.revertedWith(
          "Already collected"
        );
      });
    });

    describe("Events", function () {
      it("Should emit an event on collection funds", async function () {
        const { contract, owner, deadline } = await loadFixture(deployFixture);

        await time.increaseTo(deadline);
        const charity = await contract.charities(0);
        const fundingRaised = await charity.fundingRaised.toString();

        expect(contract.collectFunds(0, owner.address))
          .to.emit(contract, "CollectedFunds")
          .withArgs(0, owner.address, fundingRaised);
      });
    });

    describe("Transfers", function () {
      it("Should transfer the funds to the charity creator", async function () {
        const { contract, owner, otherAccount, deadline } = await loadFixture(
          deployFixture
        );

        const donationValue = 10000;
        await contract
          .connect(otherAccount)
          .donate(0, { value: donationValue });
        await time.increaseTo(deadline);

        expect(contract.collectFunds(0, owner.address)).to.changeEtherBalances(
          [owner, contract],
          [donationValue, -donationValue]
        );

        const charity = await contract.charities(0);
        expect(await charity.fundsCollected).to.equal(true);
      });
    });
  });
});
