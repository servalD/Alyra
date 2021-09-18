
const Web3 = require('web3')
const rpcURL = "https://ropsten.infura.io/v3/MyID"
const web3 = new Web3(rpcURL)

web3.eth.getBalance("ADDR", (err, wei) => { 
    balance = web3.utils.fromWei(wei, 'ether'); // convertir la valeur en ether
    console.log(balance);
 });