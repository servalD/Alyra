var  Web3  =  require('web3');
web3  =  new  Web3('https://ropsten.infura.io/v3/MyID');

var  ethTx  = ('0x7b96ea05b0111b1ad451be9f4de3c54af6f430142b2aa39379e4c7f85280fa1c');

web3.eth.getTransaction(ethTx, function(err, result) { 

    if (!err  &&  result  !==  null) {
        console.log(result); // Log all the transaction info
        console.log('From Address: '  +  result.from); // Log the from address
        console.log('To Address: '  +  result.to); // Log the to address
        console.log('Ether Transacted: '  + (web3.utils.fromWei(result.value, 'ether'))); // Get the value, convert from Wei to Ether and log it
    }
    else {
        console.log('Error!', err); // Dump errors here
    }
    });