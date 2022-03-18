import { task } from "hardhat/config";
import "@nomiclabs/hardhat-waffle";
import 'dotenv/config';

const BYOB_ADDRESS = `${process.env.BYOB_ADDRESS}`;

task("approve", "Approves set amount of tokens from specified account")
    .addParam("spender", "Spender address")
    .addParam("signer", "Receiver address")
    .addParam("value", "Amount of tokens to approve")
    .setAction(async (args, hre) => {
        const byob = await hre.ethers.getContractAt("ByobToken", BYOB_ADDRESS);
        const signer = await hre.ethers.getSigner(args.signer);
        await (await byob.connect(signer).approve(args.spender, args.value)).wait()
        console.log(`Approved ${args.value} tokens to transfer from ${args.spender}. Approved total: ${await byob.allowance(args.signer, args.spender)}`);
    });
task("transfer", "Transfers set amount of tokens from contract owner to specified account")
    .addParam("to", "Receiver address")
    .addParam("value", "Amount of tokens to send")
    .setAction(async (args, hre) => {
        const byob = await hre.ethers.getContractAt("ByobToken", BYOB_ADDRESS);
        await byob.transfer(args.to, args.value);
        console.log(`Transferred ${args.value} tokens to ${args.to}. Updated balance: ${await byob.balanceOf(args.to)} tokens`);
    });
task("transfer-from", "Transfers set amount of tokens from one account to another")
    .addParam("from", "Sender address")
    .addParam("to", "Receiver address")
    .addParam("value", "Amount of tokens to send")
    .setAction(async (args, hre) => {
        const byob = await hre.ethers.getContractAt("ByobToken", BYOB_ADDRESS);
        const signer = await hre.ethers.getSigner(args.from);
        await byob.connect(signer).transferFrom(args.from, args.to, args.value);
        console.log(`Transferred ${args.value} tokens from ${args.from} to ${args.to}. Updated balance: ${await byob.balanceOf(args.to)} tokens`);
    });