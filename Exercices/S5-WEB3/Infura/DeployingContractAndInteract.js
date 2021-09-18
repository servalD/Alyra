var Tx     = require('ethereumjs-tx').Transaction
const Web3 = require('web3')
const web3 = new Web3('https://ropsten.infura.io/v3/MyID')

const account1 = 'ADDR' // Your account address 1
const privateKey1 = Buffer.from('PK', 'hex')

// Deploy the contract
web3.eth.getTransactionCount(account1, (err, txCount) => {
   const data = '0x608060405234801561001057600080fd5b50610150806100206000396000f3fe608060405234801561001057600080fd5b50600436106100365760003560e01c806360fe47b11461003b5780636d4ce63c14610057575b600080fd5b6100556004803603810190610050919061009d565b610075565b005b61005f61007f565b60405161006c91906100d9565b60405180910390f35b8060008190555050565b60008054905090565b60008135905061009781610103565b92915050565b6000602082840312156100b3576100b26100fe565b5b60006100c184828501610088565b91505092915050565b6100d3816100f4565b82525050565b60006020820190506100ee60008301846100ca565b92915050565b6000819050919050565b600080fd5b61010c816100f4565b811461011757600080fd5b5056fea26469706673582212205e53afd2c3718753f84c2a89ac74e5697176e3f37126190b9b8cd6d993f7301264736f6c63430008070033';

 const txObject = {
   nonce:    web3.utils.toHex(txCount),
   gasLimit: web3.utils.toHex(1000000), // Raise the gas limit to a much higher amount
   gasPrice: web3.utils.toHex(web3.utils.toWei('10', 'gwei')),
   data: data
 }

 var tx = new Tx(txObject, {'chain':'ropsten'});
 tx.sign(privateKey1)

 const serializedTx = tx.serialize()
 const raw = '0x' + serializedTx.toString('hex')

 web3.eth.sendSignedTransaction(raw, (err, txHash) => {
   if (err)console.log('err:', err, 'txHash:', txHash)
   else {
     console.log('Transaction initiated, deployement...\ntxHash:', txHash)
    }
  }).then((receipt) => {
    console.log( receipt.contractAddress)
    const ABI = [{"inputs":[],"name":"get","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"x","type":"uint256"}],"name":"set","outputs":[],"stateMutability":"nonpayable","type":"function"}]
    const simpleStorage = new web3.eth.Contract(ABI, receipt.contractAddress);

    simpleStorage.methods.get().call((err, data) => {
      if (err)console.log(err);
      else console.log(data);
    return Promise.resolve(data)}).then((data) => {
      data = simpleStorage.methods.set(data+1).encodeABI();

      web3.eth.getTransactionCount(account1, (err, txCount) => {
      const txObject = {
        nonce:    web3.utils.toHex(txCount),
        gasLimit: web3.utils.toHex(1000000), // Raise the gas limit to a much higher amount
        gasPrice: web3.utils.toHex(web3.utils.toWei('10', 'gwei')),
        to: receipt.contractAddress,
        data: data
      }
     
      var tx = new Tx(txObject, {'chain':'ropsten'});
      tx.sign(privateKey1)
     
      const serializedTx = tx.serialize()
      const raw = '0x' + serializedTx.toString('hex')
      web3.eth.sendSignedTransaction(raw, (err, txHash) => {
        console.log('set err:', err, 'txHash:', txHash)
        // Use this txHash to find the contract on Etherscan!
      }).then(() => {
        simpleStorage.methods.get().call((err, data) => {
          if (err)console.log(err);
          else console.log(data)})
      })
    })
   })
    

  })
})
