// SPDX-License-Identifier: MIT
pragma solidity 0.6.11;

contract Choice {
    
    mapping ( address => uint) private choices;
    
    function add(uint _myuint) public {
        choices[msg.sender] = _myuint;
    }
}