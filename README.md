# Homework: Charity Platform

This project demonstrates a basic Hardhat use case. It implements a Charity Platform project that is part of SoftUni Blockchain Course April 2023 and serves as Exam-Preparation.

Contract successfully deployed and verified on:
[Sepolia network](https://sepolia.etherscan.io/address/0xe71f667B7432B86798221Be90360Ae5E8C5c0E27)

## Main functionalities of the contract include:

- Creation of a charity
- Donation to an existing charity
- Collecting funds from a completed charity
- Refunding funds to contributors when charity was incomplete

As per requirements:
100% test coverage of Donation and Successful Campaign Funds Release functionalities logic
Deployment and Create Charity tasks implemented

## To running some of the following tasks:

```shell
yarn hardhat deploy --network <<networkname>> (optional)
yarn hardhat create-charity --charityplatform <<contractAddress>>

yarn hardhat test
yarn hardhat coverage
```

## License

UNLICENSED

### For running the project locally make sure the following settings are presented in your local .env file:

```shell
SEPOLIA_KEY=
ACCOUNT_PRIVATE_KEY=
ETHERSCAN_API_KEY=
```
