task("deploy", "Deploys the contract").setAction(async (taskArgs, hre) => {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const CharityPlatformFactory = await hre.ethers.getContractFactory(
    "CharityPlatform"
  );
  const charityPlatform = await CharityPlatformFactory.deploy();
  await charityPlatform.deployed();

  console.log("CharityPlatform deployed to:", charityPlatform.address);
});

task("create-charity")
  .addParam("charityplatform", "The Charity Platform address")
  .setAction(async (taskArgs, hre) => {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Connectiong to contracts with the account:", deployer.address);

    const CharityPlatformFactory = await hre.ethers.getContractFactory(
      "CharityPlatform"
    );

    const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;

    const charityPlatform = await CharityPlatformFactory.attach(
      taskArgs.charityplatform
    );
    const tx = await charityPlatform.createCharity(
      "First Charity",
      "First Charity Description",
      ethers.utils.parseEther("100"),
      ONE_YEAR_IN_SECS * 100
    );

    const receipt = await tx.wait();

    if (receipt.status === 0) {
      throw new Error("Transaction failed");
    }

    console.log(`Transaction: ${tx.hash}`);
    console.log(receipt);
    console.log("Charity created!");
  });
