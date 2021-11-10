import Web3 from "web3";
import detectEthereumProvider from '@metamask/detect-provider';

class Ieth {
  constructor(){
    this.web3 = null;
    this.connectionStatus = 0;
    this.account = ''
  }

  getStatusText(){
    switch (this.connectionStatus){
      case -4:
        return "Wrong network"
      case -3:
        return "Error connecting Metamask";
      case -2:
        return "Please, install Metamask";
      case -1:
        return "Open metamask to connect";
      case 0:
        return "Connect to wallet";
      case 1:
        return "Connecting to wallet";
      case 2:
        return "Wallet connected";
      default:
        return "No wallet status!";
    }
  }

  async cleanupWeb3(events) {
    console.log('Disconnecting events...')
    const eth = this.web3.currentProvider
    const existingEvents = await eth.eventNames();
    for (const event in events){
      if (existingEvents.includes(event)){
        await eth.on(event, events[event]);
      }
    }
    console.log('Events disconnected ;')
    this.web3 = null;
    this.connectionStatus = 0;
    this.account = ''
    console.log('Provider disconnected ;')
  }

  async setupWeb3(events) {
    try{
      let web3 = null;
      const provider = await detectEthereumProvider();

      if (provider) {
        web3 = new Web3(provider);
        console.log('loaded ethereum provider ;');
      }
      else if (window.ethereum) {
        web3 = new Web3(window.ethereum);
        console.log('loaded window.ethereum ;');
      }
      else if (window.web3) {
        // Use Mist/MetaMask's provider.
        console.log("Injected web3 detected ;");
        web3 = window.web3;
      }
      // Fallback to localhost; use dev console port by default...
      else {
        console.log("No web3 instance injected, using Local web3...");
        const provider = new Web3.providers.HttpProvider("http://127.0.0.1:7545");
        web3 = new Web3(provider);
      }
      if (web3){
        if (await web3.eth.net.getId() === 5777) {
          this.web3 = web3;
          console.log('Connecting Metamask events...')
          const eth = web3.currentProvider
          const existingEvents = await eth.eventNames();
          for (const event in events){
            if (!existingEvents.includes(event)){
              await eth.on(event, events[event]);
            }
          }
          console.log('Events connected ;\nAsk for a metamask connection...')
          await web3.currentProvider.request({ method: 'eth_requestAccounts' })
          .then((e) => {this.account = e[0]});
          console.log('Metamask connection completed ;')
        }else{
          this.connectionStatus = -4// Uncached error!!
          return -4
        }
      }else{
        this.connectionStatus = -3// Uncached error!!
        return -3
      }
      if (this.account){
        this.connectionStatus = 2// Connected
        return 2
      }
      else{
        this.connectionStatus = 0// Not connected
        return 0
      }
    }catch (error) {
      console.error(error)
      if (error.code===4001){// Connection aborted by the user
        this.connectionStatus = 0
        return 0
      } else if (error.code===-32002){// Connection request already sent to metamask (but probably not opened by the user or hided)
        this.connectionStatus = -1
        return -1
      }
      this.connectionStatus = -2// Metamask not installed
      return -2
    }
  }
}

export default Ieth;
