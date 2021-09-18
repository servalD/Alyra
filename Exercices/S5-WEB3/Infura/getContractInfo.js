var  Web3  =  require('web3');
web3  =  new  Web3('https://ropsten.infura.io/v3/80ea0f21858e493d9032a8cb34354106');

var  abi  =  [{"inputs":[],"name":"get","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"x","type":"uint256"}],"name":"set","outputs":[],"stateMutability":"nonpayable","type":"function"}]
var addr = '0xCbd43b4CF42101693689a1f9C201471d8f505E8f'

var  Contract  =  new  web3.eth.Contract(abi, addr);

Contract.methods.get().call().then(console.log);