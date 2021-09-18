// contracts/Admin.sol
// SPDX-License-Identifier: MIT

pragma solidity 0.8.0;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/access/Ownable.sol";

contract Admin is Ownable{
    // Enum of they different stats of the address register
    enum stats {Unknow, Unlocked, Locked}
    // Address status register
    mapping(address=>stats) private register;
    // Events 
    event Whitelisted(address _address);
    event Blacklisted(address _address);
    // Only owner used functions (using the openzeppelin modifier)
    function whitelist(address _address) public onlyOwner{
        register[_address] = stats.Unlocked;
        emit Whitelisted(_address);
    }
    
    function blacklist(address _address) public onlyOwner{
        register[_address] = stats.Locked;
        emit Blacklisted(_address);
    }
    // Functions usable by everyone
    function isWhitelisted(address _address) public view returns (bool){
        return register[_address]==stats.Unlocked;
    }
    
    function isBlacklisted(address _address) public view returns (bool){
        return register[_address]==stats.Locked;
    }
    
}