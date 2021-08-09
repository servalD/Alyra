// contracts/Bank.sol
// SPDX-License-Identifier: MIT
pragma solidity 0.8.0; // Je ne sais pas comment changer la version spécifiée dans les pragma d'OpenZeppelin donc je ne respecte pas la conssigne de compiler en 0.6.11

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/utils/math/SafeMath.sol";

contract Bank {
    using SafeMath for uint;
    // Address balances
    mapping (address => uint) private _balances;
    
    // Adding the given amount to the sender address balance
    function deposit(uint _amount) public {
        _balances[msg.sender] += _amount;
    }
    
    // Transferring the given amount from the sender address balance to the _recipient address balance if the sender address balance is enough
    function transfer(address _recipient, uint _amount) public{
        require(_balances[msg.sender] >= _amount, "Account balance sender should be at less equal to the transfering amount.");
        _balances[msg.sender] -= _amount;
        _balances[_recipient] += _amount;
    }
    
    // Returns the balance of the given address
    function balanceOf(address _address) public view returns (uint){
        return _balances[_address];
    }
}