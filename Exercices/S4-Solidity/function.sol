pragma solidity 0.6.11;

contract Whitelist {
    struct Person {
        string name;
        uint age;
    }
    function addPerson(string memory _name, uint _age) public {
        Person memory person = Person(_name, _age);
    }
}