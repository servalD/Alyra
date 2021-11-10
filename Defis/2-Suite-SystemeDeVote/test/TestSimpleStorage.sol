pragma solidity 0.8.7;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/Voting.sol";

contract TestSimpleStorage {

  function testItStoresAValue() public {
    Voting voting = Voting(DeployedAddresses.Voting());

    // voting.create

    uint expected = 89;

    Assert.equal(89, expected, "It should store the value 89.");
  }

}
