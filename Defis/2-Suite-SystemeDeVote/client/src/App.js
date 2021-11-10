import React, { Component } from "react";
// App styles import
import "./App.css";
import './components/Button/buttonfx.css';
import './components/Input/inputfx.css';
import './components/Input/TextArea.css';
import './components/List/List.css';
// web3 and contracts import
import Ieth from "./getWeb3";
import VotingAPI from "./contracts/VotingAPI";
// Components import
import ConnectedView from "./components/ConnectedView";

class App extends Component {
  state = {
    connectionStatus: 0,
    contract: null,
    tablesDatasVotes: [],
    tablesDatasProposals: [],
    currentVoteIndex: 0,
  };

  constructor(props) {
    super(props);
    this.Ieth = new Ieth();
    this.connectedRef = React.createRef();
    this.initialized = false;
    this.metamaskEvents = {
      // connect: async (ev) => {console.log('Account Connected', ev)},// Unable to trigg it !!
      // disconnect: async (ev) => {console.log('Account Disconnected', ev)},// Unable to trigg it !!
      accountsChanged: async (ev) => {
        if (ev.length) {
          console.log('Account Changed', ev[0]);
          window.location.reload()
        } else {
          console.log('Account Disconnected');
          this.Ieth.connectionStatus = 0;
          this.setState({ connectionStatus: 0 });
        };
      },
      chainChanged: async (ev) => { console.log('Chain Changed', parseInt(ev));  window.location.reload()},
      message: async (ev) => {
        // if ()
        console.log('Message', ev)
      },
      recept: async (err) => {
        console.error(err)
      }
    };
    window.addEventListener('load', async () => { await this.connectWallet() })
    window.addEventListener('unload', async () => { await this.Ieth.cleanupWeb3(this.metamaskEvents) })
    window.addEventListener('resize', this.reportWindowSize);
  }

  reportWindowSize = async () => {
    var appDiv = document.getElementsByClassName('App')[0];
    var height = appDiv.scrollHeight <= window.innerHeight ? '100vh;' : 'max-content'
    var width = appDiv.scrollWidth <= window.innerWidth ? '100vw;' : 'max-content'
    appDiv.setAttribute("style", "height:" + height + 'px;' + "width:" + width);

  }

  onVoted = async (voteIndex, voter, proposalId) => {
    if (this.Ieth.account.toLowerCase() === voter.toLowerCase()) {
      voteIndex = parseInt(voteIndex)
      proposalId = parseInt(proposalId)
      const votesTableData = this.state.tablesDatasVotes
      votesTableData[voteIndex].votedIndex = proposalId
      this.setState({ tablesDatasVotes: votesTableData })
    }
  }

  onNewVote = async (vote, index) => {
    vote = { id: index, Tips: vote[0], State: parseInt(vote[1]), Registered: vote[2], votedIndex: parseInt(vote[3]), owner: vote[4], winningProposal: parseInt(vote[5]) }
    await this.setState({
      tablesDatasVotes: [...this.state.tablesDatasVotes, vote],
    })
    document.getElementById('voteTable').lastChild.click()
    document.getElementById('newVoteInput').value = ''
  }
  onProposalRegistered = async (voteIndex, proposalIndex, proposal) => {
    voteIndex = parseInt(voteIndex)
    const proposalsByVote = this.state.tablesDatasProposals
    if (!proposalsByVote[voteIndex])proposalsByVote.push([])
    proposalsByVote[voteIndex].push({ id: proposalIndex, Proposal: proposal })
    document.getElementById('proposalTable').lastChild.click()
    document.getElementById('stdInput').value = ''
    this.setState({ tablesDatasProposals: proposalsByVote })
  }
  onWorkflowStatusChanged = async (voteIndex, previousStatus, newStatus) => {
    voteIndex = parseInt(voteIndex)
    const votesTableData = this.state.tablesDatasVotes
    votesTableData[voteIndex].State = parseInt(newStatus)
    // console.log(previousStatus, newStatus)
    this.setState({ tablesDatasVotes: votesTableData })
  }
  onVoterRegistered = async (voteIndex, address) => {
    if (this.Ieth.account.toLowerCase() === address.toLowerCase()) {
      voteIndex = parseInt(voteIndex)
      const votesTableData = this.state.tablesDatasVotes
      votesTableData[voteIndex].Registered = 'Yes';
      this.setState({ tablesDatasVotes: votesTableData })
    }
    document.getElementById('stdInput').value = ''
  }

  connectWallet = async () => {
    // Connecting to wallet status
    this.reportWindowSize()
    console.log('connecting wallet...')
    this.setState({ connectionStatus: 1 });
    const coStatus = await this.Ieth.setupWeb3(this.metamaskEvents);

    if (coStatus === 2) {
      this.contract = new VotingAPI(this.Ieth)
      await this.contract.setupContract(this.onNewVote, this.onProposalRegistered, this.onWorkflowStatusChanged, this.onVoterRegistered, this.onVoted)
      this.setState({
        contract: this.contract,
        connectionStatus: coStatus,
        tablesDatasVotes: await this.contract.getVotesTableData(),
        tablesDatasProposals: await this.contract.getProposalTableData()
      });
    } else {
      this.setState({ connectionStatus: coStatus });
      console.log('Wallet not connected ;')
      return;
    }
    console.log('Wallet connected ;')

  };

  render() {
    console.log('render app')
    return (
      <div className="App" >
        <div style={{maxWidth:1000}}>
          <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: "center" }}>
            <h1 style={{ marginLeft: 40 }} >Voting platform using ethereum</h1>
            <button className="fx" style={{ marginRight: 30 }} onClick={this.state.connectionStatus < 1 ? () => { this.connectWallet() } : () => 0} >{this.Ieth.getStatusText()}</button>
          </div>
          <p style={{ marginLeft: 25 }}>The principe of this Dapp is quit simple and is comming from an Alyra exercise. It's my first webpage ever so please, be forgiving.</p>
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
          <ConnectedView parent={this} marging={10} currentVoteIndex={this.state.currentVoteIndex} selectVoteCallBack={(selectedIndex) => { this.setState({ currentVoteIndex: selectedIndex }) }} connectionStatus={this.state.connectionStatus === 2} contract={this.state.contract} data={this.state.tablesDatasVotes} tablesDatasProposals={this.state.tablesDatasProposals} ref={this.connectedRef}></ConnectedView>
        </div>
      </div>
    );
  }
}

export default App;