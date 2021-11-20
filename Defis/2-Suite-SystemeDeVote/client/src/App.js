import React, { Component } from "react";
// App styles import
import "./App.css";
import './components/Button/buttonfx.css';
import './components/Input/inputfx.css';
import './components/Input/TextArea.css';
import './components/List/List.css';
// web3 and contracts import
import Ieth from "./getWeb3";
import VotingWrapper from "./contracts/VotingWrapper";
// Components import
import ConnectedView from "./components/ConnectedView";

var LogEnabled = false;
var myLogger = (...args) => {if (LogEnabled)console.log(...args)};

class App extends Component {
  state = {
    connectionStatus: 0,// Metamask
    contract: null,// Using web3 on VotingWrapper
    Votes: [],
    Proposals: [],
    currentVoteIndex: 0,
  };

  constructor(props) {
    super(props);
    this.Ieth = new Ieth();
    // Object containing every needed callback for metamask events.
    this.metamaskEvents = {
      accountsChanged: async (ev) => {
        if (ev.length) {
          myLogger('Account Changed', ev[0]);
        } else {
          myLogger('Account Disconnected');
          this.Ieth.cleanupWeb3();
          this.setState({ connectionStatus: 0 });
        };
        window.location.reload()
      },
      chainChanged: async (ev) => { myLogger('Chain Changed', parseInt(ev));  window.location.reload()},
    };
    window.addEventListener('load', async () => { await this.connectWallet() })
    window.addEventListener('unload', async () => { await this.Ieth.cleanupWeb3() })
    window.addEventListener('resize', this.reportWindowSize);
  }

  reportWindowSize = async () => {// Update for the backgroud size. (i have still many things to learn)
    var appDiv = document.getElementsByClassName('App')[0];
    var height = appDiv.scrollHeight <= window.innerHeight ? '100vh;' : 'max-content'
    var width = appDiv.scrollWidth <= window.innerWidth ? '100vw;' : 'max-content'
    appDiv.setAttribute("style", "height:" + height + 'px;' + "width:" + width);

  }
  // Events tasks
  onVoted = async (voteIndex, voter, proposalId) => {
    if (this.Ieth.account.toLowerCase() === voter.toLowerCase()) {
      voteIndex = parseInt(voteIndex)
      proposalId = parseInt(proposalId)
      const Votes = this.state.Votes
      Votes[voteIndex].votedIndex = proposalId
      this.setState({ Votes: Votes })
    }
  }

  onNewVote = async (vote, index) => {
    vote = { id: parseInt(index), Tips: vote[0], State: parseInt(vote[1]), Registered: vote[2], votedIndex: parseInt(vote[3]), owner: vote[4], winningProposal: parseInt(vote[5]) }
    await this.setState({
      Votes: [...this.state.Votes, vote],
    })
    document.getElementById('voteTable').lastChild.click()
    document.getElementById('newVoteInput').value = ''
  }
  onProposalRegistered = async (voteIndex, proposalIndex, proposal) => {
    voteIndex = parseInt(voteIndex)
    const Proposals = this.state.Proposals
    if (!Proposals[voteIndex])Proposals.push([])
    Proposals[voteIndex].push({ id: parseInt(proposalIndex), Proposal: proposal })
    document.getElementById('proposalTable').lastChild.click()
    document.getElementById('stdInput').value = ''
    this.setState({ Proposals: Proposals })
  }
  onWorkflowStatusChanged = async (voteIndex, previousStatus, newStatus) => {
    voteIndex = parseInt(voteIndex)
    const Votes = this.state.Votes
    Votes[voteIndex].State = parseInt(newStatus)
    // myLogger(previousStatus, newStatus)
    this.setState({ Votes: Votes })
  }
  onVoterRegistered = async (voteIndex, address) => {
    if (this.Ieth.account.toLowerCase() === address.toLowerCase()) {
      voteIndex = parseInt(voteIndex)
      const Votes = this.state.Votes
      if (voteIndex>Votes.length) throw new Error('onVoterRegistered Index error: Given vote index: '+voteIndex+' Max: '+Votes.length)
      Votes[voteIndex].Registered = 'Yes';
      this.setState({ Votes: Votes })
    }
    document.getElementById('stdInput').value = ''
  }

  connectWallet = async () => {
    // Connecting to wallet 
    this.reportWindowSize()
    myLogger('connecting wallet...')
    this.setState({ connectionStatus: 1 });//connecting status...
    const coStatus = await this.Ieth.setupWeb3(this.metamaskEvents);

    if (coStatus === 2) {// If connected
      this.contract = new VotingWrapper(this.Ieth)
      await this.contract.setupContract(this.onNewVote, this.onProposalRegistered, this.onWorkflowStatusChanged, this.onVoterRegistered, this.onVoted)
      this.setState({
        contract: this.contract,
        connectionStatus: coStatus,
        Votes: await this.contract.getVotes(),
        Proposals: await this.contract.getProposals()
      });
    } else {// If not connected
      this.setState({ connectionStatus: coStatus });
      if (coStatus===-4) this.Ieth.switchNetwork()
      myLogger('Wallet not connected ;')
      return;
    }
    myLogger('Wallet connected ;')

  };

  render() {
    myLogger('render app')
    return (
      <div className="App" >
        <div style={{maxWidth:1000}}>
          <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: "center" }}>
            <h1 style={{ marginLeft: 40 }} >Voting platform using ethereum</h1>
            <button className="fx" style={{ marginRight: 30 }} onClick={this.state.connectionStatus < 1 ? () => { this.connectWallet() } : () => 0} >{this.Ieth.getStatusText()}</button>
          </div>
          <p style={{ marginLeft: 25 }}>The principe of this Dapp is comming from an Alyra exercise. I'm glad to show you my firs web page!</p>
          <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-evenly', alignItems: "center" }}>
            <img src="/Vote1.png" alt="Hand votting in the box" style={{ width: 256 }}></img>
            <div style={{ marginLeft: 15 }}>
              <h4 style={{ marginLeft: 15 }}>Conduct of a vote:</h4>
              <div style={{ marginLeft: 40 }}>
                <p>-Create a new vote.</p>
                <p>-Register the address of voting members.</p>
                <p>-invite members to make proposals to solve the voting problem.</p>
                <p>-Start the votting phase.</p>
                <p>-Present the result to members.</p>
              </div>
            </div>
          </div>
          <ConnectedView parent={this} marging={10} currentVoteIndex={this.state.currentVoteIndex} selectVoteCallBack={(selectedIndex) => { this.setState({ currentVoteIndex: selectedIndex }) }} connectionStatus={this.state.connectionStatus === 2} contract={this.state.contract} Votes={this.state.Votes} Proposals={this.state.Proposals}></ConnectedView>
        </div>
      </div>
    );
  }
}

export default App;