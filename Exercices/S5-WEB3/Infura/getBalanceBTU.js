// Not licencied
//// @dev: Import web3 lib.
const Web3 = require("web3");
//// @dev: Use infura mainnet id.
web3 = new Web3('https://mainnet.infura.io/v3/MyID')
//// @dev: Deliveries ABI
const ABI = [{"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"}]
//// @dev: Contract address.
const addr = "0xb683d83a532e2cb7dfa5275eed3698436371cc9f"
//// @dev: Create a new contract instance.
var  Contract  =  new  web3.eth.Contract(ABI, addr);
console.log(Contract.methods)
//// @dev: Call the getBalance method on the given account address.
Contract.methods.balanceOf('0xd804ab1667e940052614a5acd103dde4d298ce36').call().then(console.log);