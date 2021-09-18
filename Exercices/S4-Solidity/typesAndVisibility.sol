// SPDX-License-Identifier: MIT
pragma solidity 0.6.11;
contract HelloWorld {
    string myString = "Hello World !";
    function hello() external view returns (string memory){
        return myString;
    }
} 