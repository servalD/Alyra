import VotingContract from "./Voting.json";

var LogEnabled = false;
var myLogger = (...args) => { if (LogEnabled) console.log(...args) };

class VotingWrapper {
  // Wrapper around the web3.eth.Contract object to make the front code more readable
  constructor(Ieth) {
    this.Ieth = Ieth;// Web3 provider
    this.errorRegexpr = /reason": ?"(.+?)"/m;// Errors from the contract
    this.internalErrorRegExpr = /message": ?"(.+?)"/m;// Errors from metamask
    this.GanacheMultiEventFence = []// Event id list used to block already raised events (bug from ganache, metamask or this code...)
  }

  static getTextError(errorID) {
    if (typeof (errorID) === 'string') errorID = parseInt(errorID);
    let message = '';
    switch (errorID) {
      case 0:
        message = 'Ownable: caller can be only the owner of the vote'; break;
      case 1:
        message = 'Listed: caller has not been registered by the owner'; break;
      case 2:
        message = 'Ownable or listed only'; break;
      case 3:
        message = 'Tips should not be empty'; break;
      case 4:
        message = 'The vote is already done'; break;
      case 5:
        message = 'We should have at least two voters to continue the workflow'; break;
      case 6:
        message = "We should have at least one Proposal to continue the workflow"; break;
      case 7:
        message = 'Unable to register anyone after the RegisteringVoters workflow status'; break;
      case 8:
        message = 'Address already registered'; break;
      case 9:
        message = 'Unable to register any proposals. Proposals Registration not started or already ended'; break;
      case 10:
        message = 'Unable to vote while the current workflow status is not VotingSessionStarted'; break;
      case 11:
        message = "You can t vote twice"; break;
      case 12:
        message = 'votedProposalId doesn t exist'; break;
      case 13:
        message = "Given vote index doesn't exist"; break;
      case 14:
        message = "This address has not voted"; break;
      case 15:
        message = "Vote not tallied yet"; break;
      default:
        message = 'Undefined Error'; break;
    }
    return "Contract has been reverted:\n" + message;
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
    if (message) { message = VotingWrapper.getTextError(message[1]) }
    else { // If there is a metamask related error
      message = this.internalErrorRegExpr.exec(error.message) 
      if (message) { message = message[1] }
      else { message = error.message }// Otherwise show all the message for unhandled errors
    }
    console.error(message);
    message = message + '\n\nYou can reload the app or retry the transaction to fix the problem.'
    if (message.includes("the tx doesn't")) message = message + '\nPeraps to restart ganache!'
    alert(message)
  }

  contractSubscribe = async (eventName, callback) => {// Do subscribe on a separated method because of an unexpected multi subscription using a single code block!!!
    myLogger('Wrapper event subscribtion: ', eventName);// And better factorisation.
    const event = await this.contract.events[eventName]();
    if (!event._events.data) await event.on('data', (event) => {
      if (!this.GanacheMultiEventFence.includes(event.id)) {
        this.GanacheMultiEventFence.push(event.id); callback(event);
      } else { myLogger('MultiEvent Detected on ' + eventName + ' !!!') }
    });
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
    myLogger('Smart contract instantiation...')
    const networkId = await web3.eth.net.getId();
    this.contract = new web3.eth.Contract(VotingContract.abi, VotingContract.networks[networkId].address);

    const callFrom = { from: account };

    this.contractMethods = []// List all contracts methods which will be wrapped automaticaly
    for (let method of this.contract._jsonInterface) {// Iterate on contracts entities
      let interactionMethod = ''// Detect if the method is changing the contract state with stateMutability member and select between 'call' or 'send' interaction method
      if (method.type === 'function') {// Filter only function and not events...
        myLogger('Wrapping method: ' + method.name)
        this.contractMethods.push(method.name)
        interactionMethod = method.stateMutability === 'view' || method.stateMutability === 'pure' ? 'call' : 'send'
        if (interactionMethod === 'send') {
          this[method.name] = async (...args) => {
            let ret = null;
            await this.contract.methods[method.name](...args).call(callFrom)
              .then(async () => {
                ret = await this.contract.methods[method.name](...args).send(callFrom)
                myLogger(method.name + '(' + method.inputs.map((e, i) => e.name + ": " + args[i]) + ")." + interactionMethod + "() => " + (typeof ret === 'object' ? JSON.stringify(ret) : ret))
              })
              .catch(this.handleError)
            return ret;
          }
        }
        else {
          this[method.name] = async (...args) => {
            let ret = null;
            ret = await this.contract.methods[method.name](...args).call(callFrom)
              .then((retu) => {myLogger(method.name + '(' + method.inputs.map((e, i) => e.name + ": " + args[i]) + ")." + interactionMethod + "() => " + (typeof retu === 'object' ? JSON.stringify(retu) : retu));return retu})
              .catch(this.handleError)
            return ret
          }
        }
      }
    }
    // Manual event subscribtion to format callbacks input parameter inside this object (It could be better organized...)
    await this.contractSubscribe('VoteCreated', async (event) => { onNewVote(await this.getFullPersonalVoteInfo(event.returnValues[0]), event.returnValues[0]) })
    await this.contractSubscribe('ProposalRegistered', async (event) => {
      onProposalRegistered(event.returnValues[0],
        event.returnValues[1],
        await this.getProposalDescriptionById(event.returnValues[0],
          event.returnValues[1]))
    })
    await this.contractSubscribe('WorkflowStatusChange', async (event) => { onWorkflowStatusChanged(event.returnValues[0], event.returnValues[1], event.returnValues[2]) })
    await this.contractSubscribe('VoterRegistered', async (event) => { onVoterRegistered(event.returnValues[0], event.returnValues[1]) })
    await this.contractSubscribe('Voted', async (event) => { onVoted(event.returnValues[0], event.returnValues[1], event.returnValues[2]) })

    myLogger('Smart contract interfaced ;')
  }

}

export default VotingWrapper;