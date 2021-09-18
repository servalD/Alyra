import logo from './logo.svg';
import './App.css';

class Chains{
  IDs = [1, 3, 4, 5, 2018, 61, 63, 6, 212]
  Names = ['mainnet', 'ropsten', 'rinkeby', 'goerly', 'dev', 'classic', 'mordor', 'kotti', 'astor']
  constructor(provider){
    this.provider = provider
    if (!provider)window.alert('Please, install MetaMask extention.')
    if (provider !== window.ethereum) console.error('Do you have multiple wallets installed?2');
    this.created = provider.request({ method: 'eth_chainId' }).then(ret => {
    this.id = parseInt(ret);
    this.name = this.fromId(this.id)
    this.initDone = true})
    provider.on('chainChanged', this.handleChainChanged)
  }
  fromId(id) {
    id = typeof id === "string" ? parseInt(id) : id
    return this.Names[this.IDs.findIndex((value) => value===id)];
  }
  fromName(name) {
    return this.IDs[this.Names.findIndex((value) => value===name)];
  }
  handleChainChanged = ((_chainId) => {
    // We recommend reloading the page, unless you must do otherwise
    window.location.reload();
  }).bind(this)
  getBalance(address){
    return this.provider.request({ method: 'eth_getBalance', params: [address] }).then(balance => parseInt(balance))
  }
}
// get balance using MetaMask

function App(props) {
  // If the provider returned by detectEthereumProvider is not the same as
  // window.ethereum, something is overwriting it, perhaps another wallet.
  const provider = props.provider;
  const chain = new Chains(provider)
  chain.created.then(() => console.log(chain.name))
  const getBalance = () => {chain.getBalance("0x795dD0AFFB37E91F5Fff919c14d3E1aDBe5C74D4").then(balance => alert(balance+" wei"))}
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
        <button onClick={getBalance}>getBalance</button>
      </header>
    </div>
  );
}

export default App;
