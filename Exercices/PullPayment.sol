// contracts/Bonne_pratique.sol
// SPDX-License-Identifier: MIT

pragma solidity 0.8.0;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/access/Ownable.sol";

// This contract repressente an SAS bank account with a shareholder part managed by a push over pull mecanism
contract SASBankAccount is Ownable{
    
    // Internal accounts structur 
    struct Funds{
        bool partner;
        uint contribution;
        uint pull;
    }
    // Shareholder address's mapping
    mapping(address => Funds) private Accounts;
    
    // Marging needed for the internal projects
    uint private extraMarging = 1000000;
    // Global pull, to prevent parallel overdepency
    uint private glPull = 0;
    
    // Events
    event ShareholderPullAllowed(address _address);
    // (°+°) //
    
    constructor(){
        Accounts[msg.sender].partner = true;
    }
    
    // Modifier //
    
    modifier onlyShareholder(){
        require(Accounts[msg.sender].partner == true);
        _;
    }
    
    // Accounts management //
    
    // The owner can add shareholder
    function addShareholder(address _address) external onlyOwner{
        Accounts[_address].partner = true;
    }

   // Any shareholder can contribute to the projects funding the shareholders capital 
    function contribute() external payable onlyShareholder {
        require(msg.value>0, 'You must contribute a minimum');
        Accounts[msg.sender].contribution += msg.value;
    }
    
    // Allow pull
    function AllowShareholderPull(address receiver, uint amount) private {
        Accounts[receiver].contribution -= amount;
        Accounts[receiver].pull += amount;
        glPull += amount;
        emit ShareholderPullAllowed(receiver);
    }
    
    // Shareholder withdraw (pull)
    function withdrawCredits() external onlyShareholder{
        uint amount = Accounts[msg.sender].pull;
        require(amount != 0, "No fund to withdraw, please push a withdraw request");
        require(address(this).balance - extraMarging - glPull >= amount, 'The company s funds are insufficien');// Redundant with the withdrawRequest function but it's better to warn(too expensive?)
        //require(glPull >= amount, "Global pull violation. Please, contact the company")
        Accounts[msg.sender].pull = 0;
        glPull -= amount;
        payable(msg.sender).transfer(amount);
    }
    
    // Request a withdraw to the contract
    function withdrawRequest(uint amount) external onlyShareholder {
        require(Accounts[msg.sender].contribution >= amount, 'Unsufisent shareholder balance');
        require(address(this).balance - extraMarging - glPull >= amount, 'The company s funds are insufficien');
        AllowShareholderPull(msg.sender, amount);
    }
    
    // Change extraMarging by IRL shareholder's consensus
    function setExtraMarging(uint amount) external onlyOwner{
        require(amount>=0, "Extra marging company cnnot be negative");
        require(address(this).balance - glPull >= amount, "Extra marging company cannot be negative");
        extraMarging = amount;
    }
    // Some getters
    function getExtraMarging() external view onlyShareholder returns (uint){
        return extraMarging;
    }
    function getCompanyBalance() external view onlyShareholder returns (uint){
        return address(this).balance;
    }
    
    function getMyBalance() external view onlyShareholder returns (uint){
        return Accounts[msg.sender].contribution;
    }
    
    function getMyPull() external view onlyShareholder returns (uint){
        return Accounts[msg.sender].pull;
    }
}