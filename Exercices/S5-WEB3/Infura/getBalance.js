
const Web3 = require('web3')
const rpcURL = "https://ropsten.infura.io/v3/80ea0f21858e493d9032a8cb34354106"
const web3 = new Web3(rpcURL)

web3.eth.getBalance("0x795dD0AFFB37E91F5Fff919c14d3E1aDBe5C74D4", (err, wei) => { 
    balance = web3.utils.fromWei(wei, 'ether'); // convertir la valeur en ether
    console.log(balance);
 });