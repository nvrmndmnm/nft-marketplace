import { ethers } from "hardhat";
import 'dotenv/config';

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("Deploying contracts with the account:", deployer.address);

    console.log("Account balance:", (await deployer.getBalance()).toString());
    const ByobToken = await ethers.getContractFactory("ByobToken");
    const byobToken = await ByobToken.deploy();
    await byobToken.deployed();

    console.log("BYOB token address:", byobToken.address);

    const BaseNFT = await ethers.getContractFactory("BaseNFT");
    const baseNFT = await BaseNFT.deploy();
    await baseNFT.deployed();

    console.log("NFT address:", baseNFT.address);

    const Marketplace = await ethers.getContractFactory("Marketplace");
    const marketplace = await Marketplace.deploy(byobToken.address, baseNFT.address);
    await marketplace.deployed();
    await baseNFT.transferOwnership(marketplace.address);
    console.log("Marketplace contract address:", marketplace.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });