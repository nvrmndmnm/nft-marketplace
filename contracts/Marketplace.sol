// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.1;

import "./ByobToken.sol";
import "./BaseNFT.sol";

contract Marketplace {
    ByobToken public paymentToken;
    BaseNFT public nftToken;

    struct Offer {
        address seller;
        uint256 tokenId;
        uint256 price;
        bool active;
    }

    struct Auction {
        address seller;
        uint256 tokenId;
        uint256 endTime;
        bool active;
        address highestBidder;
        uint256 highestBid;
        uint256 bidsCount;
    }

    mapping(uint256 => Offer) listings;
    mapping(uint256 => Auction) auctions;

    event OfferListed(address indexed seller, uint256 tokenId, uint256 price);
    event OfferBought(uint256 tokenId);
    event OfferCancelled(uint256 tokenId);

    event AuctionListed(
        address seller,
        uint256 tokenId,
        uint256 endTime,
        uint256 minPrice
    );
    event AuctionBid(uint256 tokenId, uint256 price);
    event AuctionFinished(uint256 tokenId);
    event AuctionCancelled(uint256 tokenId);

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

    function listItem(uint256 tokenId, uint256 price) public {
        nftToken.transferFrom(msg.sender, address(this), tokenId);
        Offer memory offer = Offer(msg.sender, tokenId, price, true);
        listings[tokenId] = offer;
        emit OfferListed(msg.sender, tokenId, price);
    }

    function buyItem(uint256 tokenId) public {
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
        emit OfferBought(tokenId);
    }

    function cancel(uint256 tokenId) public {
        require(msg.sender == listings[tokenId].seller, "Not seller");
        listings[tokenId].active = false;
        nftToken.transferFrom(address(this), msg.sender, tokenId);
        emit OfferCancelled(tokenId);
    }

    function listItemOnAuction(uint256 tokenId, uint256 minPrice) public {
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
        emit AuctionListed(msg.sender, tokenId, block.timestamp + 3 days, minPrice);
    }

    function makeBid(uint256 tokenId, uint256 price) public {
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
        emit AuctionBid(tokenId, price);
    }

    function finishAuction(uint256 tokenId) public {
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
        emit AuctionFinished(tokenId);
    }

    function cancelAuction(uint256 tokenId) public {
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
        emit AuctionCancelled(tokenId);
    }
}
