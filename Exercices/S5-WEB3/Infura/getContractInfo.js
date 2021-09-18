// Not licencied
//// @dev: Import web3 lib.
const Web3 = require("web3");
//// @dev: Use infura mainnet id.
web3 = new Web3('https://mainnet.infura.io/v3/MyID')
//// @dev: Deliveries ABI
const ABI = [{"constant":true,"inputs":[],"name":"getEbola","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"kill","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"getInfo","outputs":[{"name":"","type":"string"},{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"tipCreator","outputs":[{"name":"","type":"string"},{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"}]
//// @dev: Contract address.
const contractAddr = '0xe16f391e860420E65C659111c9e1601c0F8e2818'
//// @dev: Create a new contract instance.
var  Contract  =  new  web3.eth.Contract(ABI, contractAddr);
//// @dev: 
Contract.methods.getInfo().call().then(Ret => console.log('Developer: '+Ret[0]+'\nGenome info: '+Ret[1]))
Contract.methods.getEbola().call().then(gURL => console.log('Genome URL: '+gURL))
Contract.methods.tipCreator().call().then(tip => console.log('Creator msg: '+tip[0]+'\nCreator address: '+tip[1]))
Contract.methods.kill().call().then(nopeMsg => console.log('Kill msg: '+nopeMsg))