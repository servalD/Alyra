// Not licencied
//// @dev: Import web3 lib.
const Web3 = require("web3");
//// @dev: Use infura mainnet id.
web3 = new Web3('https://ropsten.infura.io/v3/MyID')
//// @dev: Deliveries ABI
const ABI = [{"constant":true,"inputs":[],"name":"getgreeting","outputs":[{"name":"","type":"bytes32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_msg","type":"bytes32"}],"name":"greet","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_from","type":"address"},{"indexed":true,"name":"_greeting","type":"bytes32"}],"name":"Event1","type":"event"}]
//// @dev: Contract address.
const contractAddr = '0x38979119752B1891ae9B5cD6986285eA3190AE38'
//// @dev: Create a new contract instance.
var  Contract  =  new  web3.eth.Contract(ABI, contractAddr);
let lookingForAddr = "0xead30eddc47d0e067ceede73c5a11e9316b1569a"
//// @dev: Call the getBalance method on the given account address.
Contract.getPastEvents('Event1', {
    filter: {_from: lookingForAddr},
    fromBlock: 0,
    toBlock: 'latest'
}, (error, events) => {
    //console.log(events);
for (i=0; i<events.length; i++) {
    var  eventObj  =  events[i];
    console.log('Address: '  +  eventObj.returnValues._from);
    console.log('Greeting: ' + web3.utils.hexToAscii(eventObj.returnValues._greeting));
}
});