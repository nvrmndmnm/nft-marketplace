// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.1;

import "./ByobToken.sol";
import "./BaseNFT.sol";

contract Marketplace {
    ByobToken public paymentToken;
    BaseNFT public nftToken;

    struct Offer {
        address seller;
        uint tokenId;
        uint price;
        bool active;
    }

    struct Auction {
        address seller;
        uint tokenId;
        uint endTime;
        bool active;
        address highestBidder;
        uint highestBid;
        uint bidsCount;
    }

    mapping(uint => Offer) listings;
    mapping(uint => Auction) auctions;

    constructor(address paymentTokenAddress, address nftTokenAddress) {
        paymentToken = ByobToken(paymentTokenAddress);
        nftToken = BaseNFT(nftTokenAddress);
    }

    function createItem(string memory tokenUri, address owner) public payable {
        mint(owner, tokenUri);
    }

    function mint(address recipient, string memory tokenUri) internal {
        nftToken.mintNFT(recipient, tokenUri);
    }

    function listItem(uint tokenId, uint price) public {
        nftToken.transferFrom(msg.sender, address(this), tokenId);
        Offer memory offer = Offer(
            msg.sender,
            tokenId,
            price,
            true
        );
        listings[tokenId] = offer;
    }

    function buyItem(uint tokenId) public {
        require(listings[tokenId].active, "Offer is not active");
        require(
            listings[tokenId].seller != msg.sender,
            "Cannot buy from yourself"
        );
        nftToken.transferFrom(address(this), msg.sender, tokenId);
        paymentToken.transferFrom(
            msg.sender,
            listings[tokenId].seller,
            listings[tokenId].price
        );
        listings[tokenId].active = false;
    }

    function cancel(uint tokenId) public {
        require(msg.sender == listings[tokenId].seller, "Not seller");
        listings[tokenId].active = false;
        nftToken.transferFrom(address(this), msg.sender, tokenId);
    }

    function listItemOnAuction(uint tokenId, uint minPrice) public {
        nftToken.transferFrom(msg.sender, address(this), tokenId);
        Auction memory auction = Auction(
            msg.sender,
            tokenId,
            block.timestamp + 3 days,
            true,
            address(0),
            minPrice,
            0
        );
        auctions[tokenId] = auction;
    }

    function makeBid(uint tokenId, uint price) public {
        require(auctions[tokenId].active, "Auction is not active");
        require(
            auctions[tokenId].endTime > block.timestamp,
            "Auction has ended"
        );
        require(
            auctions[tokenId].highestBid < price,
            "Bid must be higher than last bid"
        );
        paymentToken.transferFrom(msg.sender, address(this), price);
        if (auctions[tokenId].highestBidder != address(0)) {
            paymentToken.transfer(
                auctions[tokenId].highestBidder,
                auctions[tokenId].highestBid
            );
        }
        auctions[tokenId].highestBidder = msg.sender;
        auctions[tokenId].highestBid = price;
        auctions[tokenId].bidsCount += 1;
    }

    function finishAuction(uint tokenId) public {
        require(auctions[tokenId].active, "Auction is not active");
        require(
            auctions[tokenId].endTime < block.timestamp,
            "Auction has not expired yet"
        );
        require(auctions[tokenId].bidsCount > 2, "There were not enough bids");
        nftToken.transferFrom(
            address(this),
            auctions[tokenId].highestBidder,
            tokenId
        );
        paymentToken.transfer(
            auctions[tokenId].seller,
            auctions[tokenId].highestBid
        );
        auctions[tokenId].active = false;
    }

    function cancelAuction(uint tokenId) public {
        require(msg.sender == auctions[tokenId].seller, "Not seller");
        require(auctions[tokenId].active, "Auction is not active");
        require(
            auctions[tokenId].endTime < block.timestamp,
            "Auction has not expired yet"
        );
        if (auctions[tokenId].highestBidder != address(0)) {
            paymentToken.transfer(
                auctions[tokenId].highestBidder,
                auctions[tokenId].highestBid
            );
        }
        nftToken.transferFrom(address(this), msg.sender, tokenId);
        auctions[tokenId].active = false;
    }
}
