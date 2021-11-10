import VotingContract from "./Voting.json";

class VotingAPI {

  constructor(Ieth) {
    this.Ieth = Ieth;
    this.errorRegexpr = /reason": ?"(.+?)"/gm;
    this.internalErrorRegExpr = /message": ?"(.+?)"/gm;
    this.GanacheMultiEventFence = []
  }

  static getStatusText(statusId) {
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

  handleError = async (error) => {
    let message = this.errorRegexpr.exec(error.message);
    if (!message) message = this.internalErrorRegExpr.exec(error.message);
    if (!message){
      console.error(error.message);
      alert(error.message);
    }else{
      console.error(message[1]);
      alert(message[1])
    }
  }

  contractSubscribe = async (eventName, callback) => {// Do subscribe on a separated method because of an unexpected multi subscription using a single code block!!!
    console.log('API event subscribtion: ', eventName);
    const event = await this.contract.events[eventName]();
    if (!event._events.data) await event.on('data', (event) => {if (!this.GanacheMultiEventFence.includes(event.id)){
                                                                  this.GanacheMultiEventFence.push(event.id);callback(event);
                                                                }else{console.log('MultiEvent Detected on '+eventName+' !!!')}});
  }

  getVotesTableData = async () => {
    // Retrive the vote count and push all vote objects in an array.
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
    const proposalCount = await this.getProposalCount(voteIndex);
    var data = [];
    // console.log('getProposalByVote', proposalCount)
    for (let i = 0; i < proposalCount; i++) {
      data.push({ id: i, Proposal: await this.getProposalDescriptionById(voteIndex, i) });
    }
    return data
  }

  getProposalTableData = async () => {
    const voteCount = await this.getVoteCount();
    var data = [];
    // console.log('getProposalTableData', voteCount)
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

    this.contractMethods = []
    for (let method of this.contract._jsonInterface) {
      let interactionMethod = ''
      let catchMethod = ''
      let catchArgs = []
      if (method.type === 'function') {
        console.log(method.name)
        this.contractMethods.push(method.name)
        interactionMethod = method.stateMutability === 'view' || method.stateMutability === 'pure' ? 'call' : 'send'
        catchMethod = interactionMethod === 'call' ? 'catch' : 'on'
        catchArgs = interactionMethod === 'call' ? [this.handleError] : ['error', this.handleError]
        this[method.name] = async (...args) => await this.contract.methods[method.name](...args)[interactionMethod](callFrom)[catchMethod](...catchArgs)
      }
    }
    // Events
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

export default VotingAPI;