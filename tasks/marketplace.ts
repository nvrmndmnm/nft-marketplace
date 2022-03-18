import { task } from "hardhat/config";
import "@nomiclabs/hardhat-waffle";
import 'dotenv/config';

const MARKETPLACE_ADDRESS = `${process.env.MARKETPLACE_ADDRESS}`;


task("create-item", "Create new NFT item on marketplace")
    .addParam("owner", "Owner address")
    .addParam("uri", "IPFS metadata URI")
    .setAction(async (args, hre) => {
        const marketplace = await hre.ethers.getContractAt("Marketplace", MARKETPLACE_ADDRESS);
        const signer = await hre.ethers.getSigner(args.owner);
        await marketplace.connect(signer).createItem(args.uri, args.owner);
        console.log(`Created an NFT to address ${args.owner}.`);
    });

task("list-item", "List NFT item on marketplace")
    .addParam("seller", "Seller address")
    .addParam("id", "NFT ID")
    .addParam("price", "NFT price")
    .setAction(async (args, hre) => {
        const marketplace = await hre.ethers.getContractAt("Marketplace", MARKETPLACE_ADDRESS);
        const signer = await hre.ethers.getSigner(args.seller);
        await marketplace.connect(signer).listItem(args.id, args.price);
        console.log(`Listed an NFT ${args.id} with price ${args.price}`);
    });

task("buy-item", "Buy NFT item from seller")
    .addParam("buyer", "Buyer address")
    .addParam("id", "NFT ID")
    .setAction(async (args, hre) => {
        const marketplace = await hre.ethers.getContractAt("Marketplace", MARKETPLACE_ADDRESS);
        const signer = await hre.ethers.getSigner(args.buyer);
        await marketplace.connect(signer).buyItem(args.id);
        console.log(`Bought an NFT ${args.id} with address ${args.buyer}`);
    });

task("cancel-sale", "Cancel NFT listing from marketplace")
    .addParam("seller", "Seller address")
    .addParam("id", "NFT ID")
    .setAction(async (args, hre) => {
        const marketplace = await hre.ethers.getContractAt("Marketplace", MARKETPLACE_ADDRESS);
        const signer = await hre.ethers.getSigner(args.seller);
        await marketplace.connect(signer).cancel(args.id);
        console.log(`Cancelled listing of an NFT ${args.id}`);
    });

task("list-auction", "List NFT item on auction")
    .addParam("seller", "Seller address")
    .addParam("id", "NFT ID")
    .addParam("price", "NFT min price")
    .setAction(async (args, hre) => {
        const marketplace = await hre.ethers.getContractAt("Marketplace", MARKETPLACE_ADDRESS);
        const signer = await hre.ethers.getSigner(args.seller);
        await marketplace.connect(signer).listItemOnAuction(args.id, args.price);
        console.log(`Listed an NFT ${args.id} on auction with min price ${args.price}`);
    });

task("bid-auction", "Bid on NFT item on auction")
    .addParam("buyer", "Buyer address")
    .addParam("id", "NFT ID")
    .addParam("bid", "Bid amount")
    .setAction(async (args, hre) => {
        const marketplace = await hre.ethers.getContractAt("Marketplace", MARKETPLACE_ADDRESS);
        const signer = await hre.ethers.getSigner(args.buyer);
        await marketplace.connect(signer).makeBid(args.id, args.price);
        console.log(`Bid on an NFT ${args.id} with amount of ${args.price} tokens`);
    });

task("finish-auction", "Finish auction of NFT item")
    .addParam("seller", "Seller address")
    .addParam("id", "NFT ID")
    .setAction(async (args, hre) => {
        const marketplace = await hre.ethers.getContractAt("Marketplace", MARKETPLACE_ADDRESS);
        const signer = await hre.ethers.getSigner(args.seller);
        await marketplace.connect(signer).finishAuction(args.id);
        console.log(`Finished auction of NFT ${args.id}`);
    });

task("cancel-auction", "Cancel auction of NFT item")
    .addParam("seller", "Seller address")
    .addParam("id", "NFT ID")
    .setAction(async (args, hre) => {
        const marketplace = await hre.ethers.getContractAt("Marketplace", MARKETPLACE_ADDRESS);
        const signer = await hre.ethers.getSigner(args.seller);
        await marketplace.connect(signer).cancelAuction(args.id);
        console.log(`Cancelled auction of NFT ${args.id}`);
    });