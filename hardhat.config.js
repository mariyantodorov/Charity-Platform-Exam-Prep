require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
require("./tasks");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.18",
  networks: {
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${process.env.SEPOLIA_KEY}`,
      accounts: [process.env.ACCOUNT_PRIVATE_KEY ?? ""],
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};
