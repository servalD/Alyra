// SPDX-License-Identifier: MIT
pragma solidity 0.6.11;

contract Whitelist {
    struct Person {
        string name;
        uint age;
    }
    Person[] public people;
    
    
    function add(string memory _name, uint _age) public {
        Person memory person;
        person.name = _name;
        person.age = _age;
        people.push(person);
    }
    function remove() public {
        people.pop();
    }
}