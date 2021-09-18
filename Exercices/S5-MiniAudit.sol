pragma solidity ^0.8.0;
 
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/utils/math/SafeMath.sol";
 
contract Crowdsale {
   using SafeMath for uint256; //** SafeMath not definded yet. { correction to line 3 } **//
 
   address public owner; // the owner of the contract
   address public escrow; // wallet to collect raised ETH
   uint256 public savedBalance = 0; // Total amount raised in ETH
   mapping (address => uint256) public balances; // Balances in incoming Ether
 
   // Initialization
    constructor(address _escrow) { //** Same Name as the contract is not allowed. The initialization function is the 'constructor' and should not have the 'function ' declaration. **//
                                   //** The visibility should not be declared. This function is accessed at the contract deployement. **//
       owner = msg.sender;//** If the owner should be the person who initiate the transaction, the tx.origin is the method to use. **//
                         //** Otherwise, if it should be a contract, we will use msg.sender which will be direct instantiator of this contract **//
                         //** As the owner is not used in this contract, it's not critical. **//
       // add address of the specific contract
       escrow = _escrow;
   }
  
   // function to receive ETH
   receive() external payable {//** The signature of the function receving eth should not declare the 'function' keyword but only 'receive' as function name. **//
                               //** The function visibility should be external and the modifier 'payable' should be applyed. { correction on line 21 } **//
       balances[msg.sender] = balances[msg.sender].add(msg.value);
       savedBalance = savedBalance.add(msg.value);
       payable(escrow).transfer(msg.value);//** The type of an address using methods 'send' or 'transfer' should be casted to 'payable address' **//
                              //** As the 'send' method doesn't raise an exception in case of failure, the wallet will not be funded but the sender will be able to **//
                              //** withdraw they eths that the contract wallet was supposed to receive (poor wallet)
   }
  
   // refund investisor
   function withdrawPayments() public{
       address payee = msg.sender;
       uint256 payment = balances[payee];
 
       savedBalance = savedBalance.sub(payment);//** As the previous  function, if the send fails, the nexts function execution continue but the payee will be never payed **//
       balances[payee] = 0;//** We should replace the send by the transfer method or encapsulating the send into a require but it introduce a re-entrancy possible attack. **//
                           //** To protect the wallet from this attack change the location of the transfer at the end of the function or create a mutex modifier to prevent it. **//
       payable(payee).transfer(payment);
       
   }
}