import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contract, ContractFactory } from "ethers";
import { ethers } from "hardhat";

const { expect } = require("chai");

describe("Marketplace contract", () => {
    let ByobToken: ContractFactory;
    let byobToken: Contract;
    let BaseNFT: ContractFactory;
    let baseNFT: Contract;
    let Marketplace: ContractFactory;
    let marketplace: Contract;
    let owner: SignerWithAddress;
    let addr1: SignerWithAddress;
    let addr2: SignerWithAddress;

    beforeEach(async () => {
        ByobToken = await ethers.getContractFactory("ByobToken");
        BaseNFT = await ethers.getContractFactory("BaseNFT");
        Marketplace = await ethers.getContractFactory("Marketplace");
        
        byobToken = await ByobToken.deploy();
        baseNFT = await BaseNFT.deploy();
        marketplace = await Marketplace.deploy(byobToken.address, baseNFT.address);
        await byobToken.transferOwnership(marketplace.address);
        await baseNFT.transferOwnership(marketplace.address);
        [owner, addr1, addr2] = await ethers.getSigners();
        const defaultNFT = await marketplace.createItem("1", addr1.address);
    });

    describe("Deployment", () => {
        it("Should have correct payment token", async () => {
            expect(await marketplace.paymentToken()).to.equal(byobToken.address);
        });
        it("Should have correct NFT token", async () => {
            expect(await marketplace.nftToken()).to.equal(baseNFT.address);
        });
    });

    describe("Items creation", () => {
        it("Should create new NFT item", async () => {
            await marketplace.createItem("2", addr2.address);
            expect(await baseNFT.balanceOf(addr2.address)).to.equal(1);
        });
    });

    describe("Listing items with buyout option", () => {
        it("Should list items for selling", async () => {
            await baseNFT.connect(addr1).approve(marketplace.address, 1);
            await marketplace.connect(addr1).listItem(1, 100);
        });

        it("Should let customers to buy items with fixed price", async () => {
            await byobToken.transfer(addr2.address, 10000);
            await byobToken.connect(addr2).approve(addr1.address, 100);
            await baseNFT.connect(addr1).approve(marketplace.address, 1);
            await marketplace.connect(addr1).listItem(1, 100);
            await marketplace.connect(addr2).buyItem(1);
        });
        it("Should revert trying to buy inactive offers", async () => {
            await byobToken.transfer(addr2.address, 10000);
            await byobToken.connect(addr2).approve(addr1.address, 200);
            await baseNFT.connect(addr1).approve(marketplace.address, 1);
            await marketplace.connect(addr1).listItem(1, 100);
            await marketplace.connect(addr2).buyItem(1);
            await expect(marketplace.connect(addr2).buyItem(1)).to.be.revertedWith("Offer is not active");
        });
        it("Should revert trying to buy from himself", async () => {
            await byobToken.transfer(addr2.address, 10000);
            await byobToken.connect(addr2).approve(addr1.address, 200);
            await baseNFT.connect(addr1).approve(marketplace.address, 1);
            await marketplace.connect(addr1).listItem(1, 100);
            await expect(marketplace.connect(addr1).buyItem(1)).to.be.revertedWith("Cannot buy from yourself");
        });


        it("Should let sellers to cancel their listing", async () => {
            await baseNFT.connect(addr1).approve(marketplace.address, 1);
            await marketplace.connect(addr1).listItem(1, 100);
            await marketplace.connect(addr1).cancel(1);
        });
        it("Should revert non-sellers trying to cancel listing", async () => {
            await baseNFT.connect(addr1).approve(marketplace.address, 1);
            await marketplace.connect(addr1).listItem(1, 100);
            await expect(marketplace.connect(addr2).cancel(1)).to.be.revertedWith("Not seller");
        });
    });

    describe("Listing items with auction option", () => {
        it("Should list items on auction", async () => {
            await baseNFT.connect(addr1).approve(marketplace.address, 1);
            await marketplace.connect(addr1).listItemOnAuction(1, 100);
        });

        it("Should let customers to make bids", async () => {
            await baseNFT.connect(addr1).approve(marketplace.address, 1);
            await marketplace.connect(addr1).listItemOnAuction(1, 100);

            await byobToken.transfer(addr2.address, 10000);
            await byobToken.connect(addr2).approve(marketplace.address, 200);
            await marketplace.connect(addr2).makeBid(1, 200);
        });
        it("Should revert bids on inactive auctions", async () => {
            await byobToken.transfer(addr2.address, 10000);
            await byobToken.connect(addr2).approve(marketplace.address, 200);
            await expect (marketplace.connect(addr2).makeBid(1, 200)).to.be.revertedWith("Auction is not active");
        });
        it("Should revert bids on expired auctions", async () => {
            await baseNFT.connect(addr1).approve(marketplace.address, 1);
            await marketplace.connect(addr1).listItemOnAuction(1, 100);
            await ethers.provider.send("evm_increaseTime", [4 * 24 * 60 * 60]);
            await byobToken.transfer(addr2.address, 10000);
            await byobToken.connect(addr2).approve(marketplace.address, 200);
            await expect (marketplace.connect(addr2).makeBid(1, 200)).to.be.revertedWith("Auction has ended");
        });
        it("Should revert bids that less than highest", async () => {
            await baseNFT.connect(addr1).approve(marketplace.address, 1);
            await marketplace.connect(addr1).listItemOnAuction(1, 100);
            await byobToken.transfer(addr2.address, 10000);
            await byobToken.connect(addr2).approve(marketplace.address, 200);
            await marketplace.connect(addr2).makeBid(1, 200);
            await expect (marketplace.connect(addr1).makeBid(1, 150)).to.be.revertedWith("Bid must be higher than last bid");
        });

        it("Should finish expired auctions with multiple bidders", async () => {
            await baseNFT.connect(addr1).approve(marketplace.address, 1);
            await marketplace.connect(addr1).listItemOnAuction(1, 100);
            await byobToken.transfer(owner.address, 10000);
            await byobToken.connect(owner).approve(marketplace.address, 200);
            await marketplace.connect(owner).makeBid(1, 200);
            await byobToken.transfer(addr2.address, 10000);
            await byobToken.connect(addr2).approve(marketplace.address, 250);
            await marketplace.connect(addr2).makeBid(1, 250);
            await byobToken.connect(owner).approve(marketplace.address, 300);
            await marketplace.connect(owner).makeBid(1, 300);

            await ethers.provider.send("evm_increaseTime", [4 * 24 * 60 * 60]);
            await marketplace.connect(addr1).finishAuction(1);
        });
        it("Should revert finishing inactive auctions", async () => {
            await expect(marketplace.connect(addr1).finishAuction(1)).to.be.revertedWith("Auction is not active");
        });
        it("Should revert finishing active auctions", async () => {
            await baseNFT.connect(addr1).approve(marketplace.address, 1);
            await marketplace.connect(addr1).listItemOnAuction(1, 100);

            await expect(marketplace.connect(addr1).finishAuction(1)).to.be.revertedWith("Auction has not expired yet");
        });
        it("Should revert finishing unsold auctions", async () => {
            await baseNFT.connect(addr1).approve(marketplace.address, 1);
            await marketplace.connect(addr1).listItemOnAuction(1, 100);
            await byobToken.transfer(addr2.address, 10000);
            await byobToken.connect(addr2).approve(marketplace.address, 200);
            await marketplace.connect(addr2).makeBid(1, 200);
            await ethers.provider.send("evm_increaseTime", [4 * 24 * 60 * 60]);

            await expect(marketplace.connect(addr1).finishAuction(1)).to.be.revertedWith("There were not enough bids");
        });

        it("Should let sellers to cancel their auctions", async () => {
            await baseNFT.connect(addr1).approve(marketplace.address, 1);
            await marketplace.connect(addr1).listItemOnAuction(1, 100);
            await ethers.provider.send("evm_increaseTime", [4 * 24 * 60 * 60]);
            await marketplace.connect(addr1).cancelAuction(1);
        });
        it("Should return bids when auction cancelled", async () => {
            await baseNFT.connect(addr1).approve(marketplace.address, 1);
            await marketplace.connect(addr1).listItemOnAuction(1, 100);
            await byobToken.transfer(addr2.address, 10000);
            await byobToken.connect(addr2).approve(marketplace.address, 200);
            await marketplace.connect(addr2).makeBid(1, 200);
            await ethers.provider.send("evm_increaseTime", [4 * 24 * 60 * 60]);
            await marketplace.connect(addr1).cancelAuction(1);
        });
        it("Should revert non-sellers trying to cancel auctions", async () => {
            await baseNFT.connect(addr1).approve(marketplace.address, 1);
            await marketplace.connect(addr1).listItemOnAuction(1, 100);

            await expect(marketplace.connect(addr2).cancelAuction(1)).to.be.revertedWith("Not seller");
        });
        it("Should revert trying to cancel expired auctions", async () => {
            await baseNFT.connect(addr1).approve(marketplace.address, 1);
            await marketplace.connect(addr1).listItemOnAuction(1, 100);
            await ethers.provider.send("evm_increaseTime", [4 * 24 * 60 * 60]);
            await marketplace.connect(addr1).cancelAuction(1);
            await expect(marketplace.connect(addr1).cancelAuction(1)).to.be.revertedWith("Auction is not active");
        });
        it("Should revert trying to cancel active auctions", async () => {
            await baseNFT.connect(addr1).approve(marketplace.address, 1);
            await marketplace.connect(addr1).listItemOnAuction(1, 100);

            await expect(marketplace.connect(addr1).cancelAuction(1)).to.be.revertedWith("Auction has not expired yet");
        });
    });
});