var  Web3  =  require('web3');
web3  =  new  Web3('https://ropsten.infura.io/v3/MyID');

var  abi  =  [
	{
		"inputs": [],
		"name": "get",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "x",
				"type": "uint256"
			}
		],
		"name": "set",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	}
]
var addr = '0x8cD906ff391b25304E0572b92028bE24eC1eABFb'

var  Contract  =  new  web3.eth.Contract(abi, addr);

Contract.methods.get().call().then(console.log);