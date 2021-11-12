import VotingContract from "./Voting.json";

class VotingWrapper {
  // Wrapper around the web3.eth.Contract object to make the front code more readable
  constructor(Ieth) {
    this.Ieth = Ieth;// Web3 provider
    this.errorRegexpr = /reason": ?"(.+?)"/gm;// Errors from the contract
    this.internalErrorRegExpr = /message": ?"(.+?)"/gm;// Errors from metamask
    this.GanacheMultiEventFence = []// Event id list used to block already raised events (bug from ganache, metamask or this code...)
  }

  static getStatusText(statusId) {// Convert WorkflowStatus Enumeration id's from voting contract to the corresponding text
    if (typeof (statusId) === 'string') statusId = parseInt(statusId);
    switch (statusId) {
      case 0:
        return 'Registering Voters';
      case 1:
        return 'Proposals Registration Started';
      case 2:
        return 'Proposals Registration Ended';
      case 3:
        return 'Voting Session Started';
      case 4:
        return 'Voting Session Ended';
      case 5:
        return 'Votes Tallied';
      default:
        return 'Undefined Status';
    }
  }

  handleError = async (error) => {// Error handler as callback in they contract call or send methods 
    let message = this.errorRegexpr.exec(error.message);// If there is a contract error
    if (!message) message = this.internalErrorRegExpr.exec(error.message);// If there is a metamask related error
    if (!message){
      console.error(error.message);
      alert(error.message);
    }else{// Otherwise show all the message for unhandled errors
      console.error(message[1]);
      alert(message[1])
    }
  }

  contractSubscribe = async (eventName, callback) => {// Do subscribe on a separated method because of an unexpected multi subscription using a single code block!!!
    console.log('Wrapper event subscribtion: ', eventName);// And better factorisation.
    const event = await this.contract.events[eventName]();
    if (!event._events.data) await event.on('data', (event) => {if (!this.GanacheMultiEventFence.includes(event.id)){
                                                                  this.GanacheMultiEventFence.push(event.id);callback(event);
                                                                }else{console.log('MultiEvent Detected on '+eventName+' !!!')}});
  }

  getVotes = async () => {
    // Retrive the vote count and push all votes formatted to an objects in an array.
    const voteCount = await this.getVoteCount();
    var data = [];
    let ret;
    for (let i = 0; i < voteCount; i++) {
      ret = await this.getFullPersonalVoteInfo(i);
      data.push({ id: i, Tips: ret[0], State: parseInt(ret[1]), Registered: ret[2], votedIndex: parseInt(ret[3]), owner: ret[4], winningProposal: parseInt(ret[5]) });
    }
    return data;
  };

  getProposalByVote = async (voteIndex) => {
    // Retrive the proposals count for the given vote and format it to an objects pushed into an array.
    const proposalCount = await this.getProposalCount(voteIndex);
    var data = [];
    for (let i = 0; i < proposalCount; i++) {
      data.push({ id: i, Proposal: await this.getProposalDescriptionById(voteIndex, i) });
    }
    return data
  }

  getProposals = async () => {
    // Retrive the vote count and push all proposals by vote to an array
    const voteCount = await this.getVoteCount();
    var data = [];
    for (let i = 0; i < voteCount; i++) {
      data.push(await this.getProposalByVote(i));
    }
    return data;
  }

  setupContract = async (onNewVote, onProposalRegistered, onWorkflowStatusChanged, onVoterRegistered, onVoted) => {
    // Get the contract instance, link the ref on this object and attach tasks to events
    const { web3, account } = this.Ieth;
    console.log('Smart contract instantiation...')
    const networkId = await web3.eth.net.getId();
    this.contract = new web3.eth.Contract(VotingContract.abi, VotingContract.networks[networkId].address);

    const callFrom = { from: account };

    this.contractMethods = []// List all contracts methods which will be wrapped automaticaly
    for (let method of this.contract._jsonInterface) {// Iterate on contracts entities
      let interactionMethod = ''// Detect if the method is changing the contract state with stateMutability member and select between 'call' or 'send' interaction method
      let catchMethod = ''// As the catch method is different for the call or the send interaction methods, so select the correct one
      let catchArgs = []// catchArgs depending on the catchMethod
      if (method.type === 'function') {// Filter only function and not events...
        console.log(method.name)
        this.contractMethods.push(method.name)
        interactionMethod = method.stateMutability === 'view' || method.stateMutability === 'pure' ? 'call' : 'send'
        catchMethod = interactionMethod === 'call' ? 'catch' : 'on'
        catchArgs = interactionMethod === 'call' ? [this.handleError] : ['error', this.handleError]
        this[method.name] = async (...args) => await this.contract.methods[method.name](...args)[interactionMethod](callFrom)[catchMethod](...catchArgs)
      }
    }
    // Manual event subscribtion to format callbacks input parameter inside this object (It could be better organized...)
    await this.contractSubscribe('VoteCreated', async (event) => { onNewVote(await this.getFullPersonalVoteInfo(event.returnValues[0]), event.returnValues[0]) })
    await this.contractSubscribe('ProposalRegistered', async (event) => {
      onProposalRegistered(event.returnValues[0],
        event.returnValues[1],
        await this.getProposalDescriptionById(event.returnValues[0],
          event.returnValues[1]))})
    await this.contractSubscribe('WorkflowStatusChange', async (event) => { onWorkflowStatusChanged(event.returnValues[0], event.returnValues[1], event.returnValues[2]) })
    await this.contractSubscribe('VoterRegistered', async (event) => { onVoterRegistered(event.returnValues[0], event.returnValues[1]) })
    await this.contractSubscribe('Voted', async (event) => { onVoted(event.returnValues[0], event.returnValues[1], event.returnValues[2]) })
    
    console.log('Smart contract interfaced ;')
  }

}

export default VotingWrapper;