// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.1;

import "@openzeppelin/contracts/access/Ownable.sol";

contract ByobToken is Ownable {
    string public constant name = "Bring Your Own Binaries";
    string public constant symbol = "BYOB";

    uint8 public constant decimals = 18;
    uint256 public totalSupply = 69420 * 10**decimals;

    event Transfer(address indexed _from, address indexed _to, uint256 _value);
    event Approval(address indexed _owner, address indexed _spender, uint256 _value);

    mapping(address => uint256) balances;
    mapping(address => mapping (address => uint256)) allowed;

    constructor() {
        balances[msg.sender] = totalSupply;
    }

    function balanceOf(address _account) public view returns (uint256) {
        return balances[_account];
    }

    function transfer(address _to, uint256 _value) public returns (bool success) {
        require(balances[msg.sender] >= _value, "Not enough tokens.");

        balances[msg.sender] -= _value;
        balances[_to] += _value;
        emit Transfer(msg.sender, _to, _value);

        return true;
    }

    function transferFrom(address _from, address _to, uint256 _value) public returns (bool success) {
        require(_value <= balances[_from], "Not enough tokens.");
        require(_value <= allowed[_from][_to], "Not enough allowance.");

        balances[_from] -= _value;
        allowed[_from][_to] -= _value;
        balances[_to] += _value;
        emit Transfer(_from, _to, _value);

        return true;
    }
    
    function approve(address _spender, uint256 _value) public returns (bool success) {
        allowed[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);

        return true;
    }

    function allowance(address _owner, address _spender) public view returns (uint256 remaining) {
        return allowed[_owner][_spender];
    }

    function increaseAllowance(address _spender, uint256 _value) public returns (bool success) {
        approve(_spender, allowance(msg.sender, _spender) + _value);

        return true;
    }

    function decreaseAllowance(address _spender, uint256 _value) public returns (bool success) {
        uint256 currentAllowance = allowance(msg.sender, _spender);
        require(currentAllowance >= _value, 'Cannot decrease below zero.');
        approve(_spender, currentAllowance - _value);

        return true;
    }

    function mint(uint256 _value) public onlyOwner returns (bool success) {
        // require(msg.sender == owner, 'Minting is only available to the owner.');
        balances[owner()] += _value;
        totalSupply += _value;
        emit Transfer(address(0), owner(), _value);

        return true;
    }

    function burn(uint256 _value) public onlyOwner returns (bool success) {
        // require(msg.sender == owner, 'Burning is only available to the owner.');
        require(balanceOf(owner()) >= _value, 'Not enough tokens to burn.');
        balances[owner()] -= _value;
        totalSupply -= _value;
        emit Transfer(owner(), address(0), _value);

        return true;
    }
}