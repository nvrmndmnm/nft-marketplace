import { task } from "hardhat/config";
import "@nomiclabs/hardhat-waffle";
import 'dotenv/config';

const NFT_ADDRESS = `${process.env.NFT_ADDRESS}`;

task("approve-nft", "Approves an NFT from specified account")
    .addParam("spender", "Spender address")
    .addParam("signer", "Receiver address")
    .setAction(async (args, hre) => {
        const nft = await hre.ethers.getContractAt("BaseNFT", NFT_ADDRESS);
        const signer = await hre.ethers.getSigner(args.signer);
        await (await nft.connect(signer).approve(args.spender, 1)).wait();
        console.log(`Approved ${args.value} an NFT to transfer from ${args.spender}.`);
    });