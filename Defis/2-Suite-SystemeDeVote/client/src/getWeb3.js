import Web3 from "web3";
import detectEthereumProvider from '@metamask/detect-provider';

class Ieth {
  constructor() {
    this.web3 = null;
    this.connectionStatus = 0;
    this.account = '';
    this.expectedNetworkId = 5777;
  }

  getStatusText() {
    switch (this.connectionStatus) {
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

  async cleanupWeb3() {
    // Check if a connection is already alive.
    if (this.connectionStatus === 2) {
      console.log('Disconnecting events...')
      const eth = this.web3.currentProvider
      // Get connected events names from the eth API to avoid disconnecting non-existant event
      const existingEvents = await eth.eventNames();
      for (const event in this.events) {
        if (existingEvents.includes(event)) {
          await eth.on(event, this.events[event]);
        }
      }
      console.log('Events disconnected ;')
      this.connectionStatus = 0;
      this.web3 = null;
      this.account = ''
      console.log('Provider disconnected ;')
    } else console.warn('Provider already disconnected !!')
  }

  async setupWeb3(events) {
    // Check if a connection is already alive and cleanup the object if it's the case
    if (this.connectionStatus == 2) this.cleanupWeb3();
    try {// Catch all unexpected connection errors
      let web3 = null;
      const provider = await detectEthereumProvider();

      if (provider) {// If the modern way is working
        web3 = new Web3(provider);
        console.log('loaded ethereum provider ;');
      }
      else if (window.ethereum) {// Else if the other modern way if working too
        web3 = new Web3(window.ethereum);
        console.log('loaded window.ethereum ;');
      }
      else if (window.web3) {// Check the older way them
        // Use Mist/MetaMask's provider.
        console.log("Injected web3 detected ;");
        web3 = window.web3;
      }
      // Fallback to localhost; use dev console port by default... (not working for now!!!)
      else {
        console.log("No web3 instance injected, using Local web3...");
        const provider = new Web3.providers.HttpProvider("http://127.0.0.1:7545");
        web3 = new Web3(provider);
      }
      if (web3) {
        // If a network is expected (eg. using id 5777 for testing on ganache) filter it, otherwise set "expectedNetworkId" to 0.
        if (this.expectedNetworkId === 0 || await web3.eth.net.getId() === this.expectedNetworkId) {
          this.web3 = web3;
          console.log('Connecting Metamask events...');
          const eth = web3.currentProvider;
          // Get connected events names from the eth API to avoid connecting already existant event
          const existingEvents = await eth.eventNames();
          for (const event in events) {
            if (!existingEvents.includes(event)) {
              await eth.on(event, events[event]);
            }
          }
          this.events = events;// Keep the ref for the cleanup methode
          console.log('Events connected ;\nAsk for a metamask connection...')
          await web3.currentProvider.request({ method: 'eth_requestAccounts' })// Use the modern way to ensure the metamask connection is alive and
            .then((e) => { this.account = e[0] });// to retrive the current selected account address
          console.log('Metamask connection completed ;')
        } else {
          this.connectionStatus = -4// Unexpected network id!!
          return -4
        }
      } else {
        this.connectionStatus = -3// Unexpected error!! Peraps you have to install metamask!!
        return -3
      }
      if (this.account) {
        this.connectionStatus = 2// Connected ;
        return 2
      }
      else {
        this.connectionStatus = 0// Not connected (this case is aparently not nesesary)~~
        return 0
      }
    } catch (error) {
      console.error(error)
      if (error.code === 4001) {// Connection aborted by the user ;
        this.connectionStatus = 0
        return 0
      } else if (error.code === -32002) {// Connection request already sent to metamask (but probably not opened by the user or hided) ;
        this.connectionStatus = -1
        return -1
      }
      this.connectionStatus = -2// Metamask not installed!!
      return -2
    }
  }
}

export default Ieth;
