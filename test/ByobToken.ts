import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contract, ContractFactory } from "ethers";
import { ethers } from "hardhat";

const { expect } = require("chai");
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

describe("ByobToken contract", () => {
    const name: String = "Bring Your Own Binaries";
    const symbol: String = "BYOB";
    const decimals = 18;
    const totalSupply = 69420;

    let ByobToken: ContractFactory;
    let byobToken: Contract;
    let owner: SignerWithAddress;
    let addr1: SignerWithAddress;
    let addr2: SignerWithAddress;

    beforeEach(async () => {
        ByobToken = await ethers.getContractFactory("ByobToken");
        [owner, addr1, addr2] = await ethers.getSigners();

        byobToken = await ByobToken.deploy();
    });

    describe("Deployment", () => {
        it("Should have correct name", async () => {
            expect(await byobToken.name()).to.equal(name);
        });
        it("Should have correct symbol", async () => {
            expect(await byobToken.symbol()).to.equal(symbol);
        });
        it("Should have correct decimals", async () => {
            expect(await byobToken.decimals()).to.equal(decimals);
        });
        it("Should set the correct total supply", async () => {
            expect(await byobToken.totalSupply()).to.equal(ethers.utils.parseUnits(totalSupply.toString(), 18));
        });
        it("Should set the right owner", async () => {
            expect(await byobToken.owner()).to.equal(owner.address);
        });
        it("Should assign the total supply of tokens to the owner", async () => {
            const ownerBalance = await byobToken.balanceOf(owner.address);
            expect(await byobToken.totalSupply()).to.equal(ownerBalance);
        });
    });

    describe("Transfer operations", () => {
        //Test transfer function
        it("Should transfer tokens between accounts", async () => {
            await byobToken.transfer(addr1.address, 50);
            const addr1Balance = await byobToken.balanceOf(addr1.address);
            expect(addr1Balance).to.equal(50);
            await byobToken.connect(addr1).transfer(addr2.address, 50);
            const addr2Balance = await byobToken.balanceOf(addr2.address);
            expect(addr2Balance).to.equal(50);
        });
        it("Should fail if sender doesn’t have enough tokens", async () => {
            const initialOwnerBalance = await byobToken.balanceOf(owner.address);
            await expect(byobToken.connect(addr1).transfer(owner.address, 1))
                .to.be.revertedWith("Not enough tokens");
            expect(await byobToken.balanceOf(owner.address)).to.equal(
                initialOwnerBalance
            );
        });
        it("Should update balances after transfers", async () => {
            const initialOwnerBalance = await byobToken.balanceOf(owner.address);
            await byobToken.transfer(addr1.address, 100);
            await byobToken.transfer(addr2.address, 50);
            const finalOwnerBalance = await byobToken.balanceOf(owner.address);
            expect(finalOwnerBalance).to.equal(initialOwnerBalance.sub(150));
            const addr1Balance = await byobToken.balanceOf(addr1.address);
            expect(addr1Balance).to.equal(100);
            const addr2Balance = await byobToken.balanceOf(addr2.address);
            expect(addr2Balance).to.equal(50);
        });
        it("Should emit Transfer event when transferred to account", async () => {
            await expect(byobToken.transfer(addr1.address, 100)).to.emit(byobToken, 'Transfer')
                .withArgs(owner.address, addr1.address, 100);
        });

        //Test transferFrom function
        it("Should transfer tokens from account", async () => {
            await byobToken.transfer(addr1.address, 100);
            const addr1Balance = await byobToken.balanceOf(addr1.address);
            expect(addr1Balance).to.equal(100);
            await byobToken.connect(addr1).approve(owner.address, 50);
            expect(await byobToken.allowance(addr1.address, owner.address)).to.equal(50);
            await byobToken.transferFrom(addr1.address, owner.address, 20);
            expect(await byobToken.balanceOf(addr1.address)).to.equal(addr1Balance.sub(20));
        });
        it("Should fail if sender doesn't have enough tokens", async () => {
            await byobToken.transfer(addr1.address, 100);
            const addr1Balance = await byobToken.balanceOf(addr1.address);
            expect(addr1Balance).to.equal(100);
            await byobToken.connect(addr1).approve(owner.address, 100);
            await expect(byobToken.transferFrom(addr1.address, owner.address, 110))
                .to.be.revertedWith("Not enough tokens.");
            expect(await byobToken.balanceOf(addr1.address)).to.equal(addr1Balance);
        });
        it("Should fail if sender doesn't have enough allowance", async () => {
            await byobToken.transfer(addr1.address, 100);
            const addr1Balance = await byobToken.balanceOf(addr1.address);
            expect(addr1Balance).to.equal(100);
            await byobToken.connect(addr1).approve(owner.address, 50);
            await expect(byobToken.transferFrom(addr1.address, owner.address, 80))
                .to.be.revertedWith("Not enough allowance.");
            expect(await byobToken.balanceOf(addr1.address)).to.equal(addr1Balance);
        });
        it("Should update balances after transfers", async () => {
            const initialOwnerBalance = await byobToken.balanceOf(owner.address);
            await byobToken.approve(addr1.address, 100);
            await byobToken.approve(addr2.address, 50);
            await byobToken.transferFrom(owner.address, addr1.address, 100);
            await byobToken.transferFrom(owner.address, addr2.address, 50);
            const finalOwnerBalance = await byobToken.balanceOf(owner.address);
            expect(finalOwnerBalance).to.equal(initialOwnerBalance.sub(150));
            const addr1Balance = await byobToken.balanceOf(addr1.address);
            expect(addr1Balance).to.equal(100);
            const addr2Balance = await byobToken.balanceOf(addr2.address);
            expect(addr2Balance).to.equal(50);
        });
        it("Should emit Transfer event when transferred from account", async () => {
            await byobToken.approve(addr1.address, 100);
            await expect(byobToken.transferFrom(owner.address, addr1.address, 100)).to.emit(byobToken, 'Transfer')
                .withArgs(owner.address, addr1.address, 100);
        });
    });

    describe("Allowance operations", () => {
        //Test approve function
        it("Should approve payments from spender account", async () => {
            const initialAllowance = await byobToken.allowance(addr1.address, addr2.address);
            expect(initialAllowance).to.equal(0);
            await byobToken.connect(addr1).approve(addr2.address, 50);
            expect(await byobToken.allowance(addr1.address, addr2.address)).to.equal(initialAllowance.add(50));
        });
        it("Should emit Approval event when allowed transaction", async () => {
            await expect(byobToken.connect(addr1).approve(owner.address, 100)).to.emit(byobToken, 'Approval')
                .withArgs(addr1.address, owner.address, 100);
        });

        //Test increase allowance
        it("Should increase allowance of spender account", async () => {
            const initialAllowance = await byobToken.allowance(addr1.address, addr2.address);
            expect(initialAllowance).to.equal(0);
            await byobToken.connect(addr1).approve(addr2.address, 50);
            expect(await byobToken.allowance(addr1.address, addr2.address)).to.equal(initialAllowance.add(50));
            await byobToken.connect(addr1).increaseAllowance(addr2.address, 10);
            expect(await byobToken.allowance(addr1.address, addr2.address)).to.equal(initialAllowance.add(60));
        });

        //Test decrease allowance
        it("Should decrease allowance of spender account", async () => {
            const initialAllowance = await byobToken.allowance(addr1.address, addr2.address);
            expect(initialAllowance).to.equal(0);
            await byobToken.connect(addr1).approve(addr2.address, 50);
            expect(await byobToken.allowance(addr1.address, addr2.address)).to.equal(initialAllowance.add(50));
            await byobToken.connect(addr1).decreaseAllowance(addr2.address, 10);
            expect(await byobToken.allowance(addr1.address, addr2.address)).to.equal(initialAllowance.add(40));
        });
        it("Should revert if allowance decreased below zero", async () => {
            await byobToken.connect(addr1).approve(addr2.address, 50);
            await expect(byobToken.connect(addr1).decreaseAllowance(addr2.address, 60))
                .to.be.revertedWith("Cannot decrease below zero.");
        });
    });
    describe("Minting and burning tokens", () => {
        //Test mint function
        it("Should let the owner mint new tokens", async () => {
            const initialSupply = await byobToken.totalSupply();
            const initialBalance = await byobToken.balanceOf(owner.address);
            await byobToken.mint(50);
            expect(await byobToken.balanceOf(owner.address)).to.equal(initialBalance.add(50));
            expect(await byobToken.totalSupply()).to.equal(initialSupply.add(50));
        });
        it("Should revert minting from non-owner", async () => {
            await expect(byobToken.connect(addr1).mint(50))
                .to.be.revertedWith('Ownable: caller is not the owner');
        });
        it("Should emit Transfer event when minting", async () => {
            await expect(byobToken.mint(50)).to.emit(byobToken, 'Transfer')
                .withArgs(ZERO_ADDRESS, owner.address, 50);
        });

        //Test burn function
        it("Should let the owner burn tokens", async () => {
            const initialSupply = await byobToken.totalSupply();
            const initialBalance = await byobToken.balanceOf(owner.address);
            await byobToken.burn(50);
            expect(await byobToken.balanceOf(owner.address)).to.equal(initialBalance.sub(50));
            expect(await byobToken.totalSupply()).to.equal(initialSupply.sub(50));
        });
        it("Should revert burning from non-owner", async () => {
            await expect(byobToken.connect(addr1).burn(50))
                .to.be.revertedWith('Ownable: caller is not the owner');
        });
        it("Should revert if owner has not enough tokens", async () => {
            const ownerBalance = await byobToken.balanceOf(owner.address);
            await expect(byobToken.burn(ownerBalance.add(1)))
                .to.be.revertedWith('Not enough tokens to burn.');
        });
        it("Should emit Transfer event when burning", async () => {
            await expect(byobToken.burn(50)).to.emit(byobToken, 'Transfer')
                .withArgs(owner.address, ZERO_ADDRESS, 50);
        });
    });
});