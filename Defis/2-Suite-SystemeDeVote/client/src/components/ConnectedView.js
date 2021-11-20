import React, { Component } from "react";
import Table from './Table/Table';
import VotingWrapper from "../contracts/VotingWrapper";
import Web3 from "web3";

var LogEnabled = false;
var myLogger = (...args) => {if (LogEnabled)console.log(...args)};

class ConnectedView extends Component {
  // This component is only displayed if the contract is nicely interfaced.
  constructor(props) {
    super(props)
    this.proposalTableRef = React.createRef()
    this.voteTableRef = React.createRef()
    this.onClickStaged = {// To keep only one button on the vote interacion div, so it maps each onClick, text and visibility by status id
      10: { cb: undefined, txt: "", vis: () => false },
      0: {
        cb: () => { 
          const addr = document.getElementById('stdInput').value;
          if (!Web3.utils.isAddress(addr)) {
            alert('Input should be a valide address!');
            document.getElementById('stdInput').value='';
            return}
          this.props.contract.authorize(this.props.currentVoteIndex, addr) 
        },
        txt: "Register new member",
        vis: () => this.isOwner()
      },
      1: {
        cb: () => { const proposal = document.getElementById('stdInput').value;
          if (proposal===''){
            alert('Input text should not be empty!');
            return;}
          this.props.contract.newProposal(this.props.currentVoteIndex, proposal) 
        },
        txt: "Create new proposal",
        vis: () => this.isRegistered()
      },
      2: { cb: undefined, txt: "", vis: () => false },
      3: {
        cb: () => { this.props.contract.doVote(this.props.currentVoteIndex, this.proposalTableRef.current.state.currentRow) },
        txt: "Vote",
        vis: () => this.isRegistered() && !this.hasVoted()
      },
      4: { cb: undefined, txt: "", vis: () => false },
      5: { cb: undefined, txt: "", vis: () => false },
    }
    this.inputStaged = {// Same as the onClickStaged object but for the textArea (textHolder and visibility)
      10: { cb: undefined, txt: "", vis: () => false },
      0: { txt: "New member address", vis: () => this.isOwner() },
      1: { txt: "New proposal", vis: () => this.isRegistered() },
      2: { txt: undefined, vis: () => false },
      3: { txt: undefined, vis: () => false },
      4: { txt: undefined, vis: () => false },
      5: { txt: undefined, vis: () => false },
    }
  }
  // Methods to avoid undefined referancing or call and to help
  hasVote() {
    return this.props.Votes.length > 0;
  }

  hasProposal() {
    if (this.hasVote() && this.props.Proposals[this.props.currentVoteIndex]) return this.props.Proposals[this.props.currentVoteIndex].length;
    else return false;
  }

  hasVoted() {
    if (this.hasVote()) return this.props.Votes[this.props.currentVoteIndex].votedIndex > -1;
    else return false;
  }

  isOwner() {
    if (this.hasVote()) return this.props.Votes[this.props.currentVoteIndex].owner;
    else return false;
  }

  isRegistered() {
    if (this.hasVote()) return this.props.Votes[this.props.currentVoteIndex].Registered;
  }

  hasState(state) {
    if (this.hasVote()) return this.props.Votes[this.props.currentVoteIndex].State === state;
    else return false;
  }

  getCurrentState() {
    if (this.hasVote()) return this.props.Votes[this.props.currentVoteIndex].State;
    else return 10;
  }

  componentDidUpdate() {
    this.props.parent.reportWindowSize()
  }

  render() {
    myLogger('Render connected view')
    if (!this.props.connectionStatus) return (<p></p>);
    const { Votes, contract, currentVoteIndex } = this.props
    return (
      <div id={this.props.id} style={{
        marginTop: 25,
        display: 'flex',
        flexDirection: "row",
        alignItems: "center",
        justifyContent: 'space-around'
      }}>
        <div style={{ display: 'flex', flexDirection:'column' }}>
          <Table id='voteTable'
          title='Voting list'
            maxHeight={200}
            width={500}
            data={Votes}
            columnsHandler={{
              'Tips': null,
              'State': st => VotingWrapper.getStatusText(st),
              'Registered': reg => reg ? '✔' : '✘',
              'owner': owner => owner ? '👑' : "✘"
            }}
            onSelectionChanged={this.props.selectVoteCallBack}
            ref={this.voteTableRef}
            visible={this.hasVote()} />
          <div style={{ marginBottom: 10, display: 'flex', flexDirection: "row", alignItems: 'stretch' }}>
            <textarea id="newVoteInput" type="text" placeholder="Vote thematic" style={{ width: 400, borderTopRightRadius: '0px', borderBottomRightRadius: '0px' }}></textarea>
            <button onClick={() => { contract.newVote(document.getElementById('newVoteInput').value) }} style={{ width: 95, borderBottomRightRadius: '10px',borderTopRightRadius: '10px', borderWidth: 1 }}>Create new vote</button>
          </div>
        </div>
        <div className={this.hasVote() ? 'visible' : 'hidden'}
          style={{
            width: 350,
            height:300,
            padding: 4,
            margin: 4,
            display: 'flex',
            flexDirection: "column",
            alignItems: 'center',
            justifyContent: 'top',
            border: '1px solid black',
            borderRadius: 10,
            backdropFilter: 'blur(5px)',
            backgroundColor: 'rgba(255,255,255, 0.3)',
          }}>
          <div className={this.getCurrentState()<5 ? 'visible' : 'hidden'}
               style={{display: this.getCurrentState()<5 ? 'flex' : 'none',
                       flexDirection: "column",
                       alignItems: 'center',
                       justifyContent: 'center',}}>
            <h5 style={{ marginTop: '0px', marginBottom: '5px' }}>{"That's the " + VotingWrapper.getStatusText(this.getCurrentState()) + " time" + (this.hasState(0) ? ' by the owner' : '')}</h5>
            <button className={this.isOwner() && this.getCurrentState() !== 5 ? 'visible' : 'hidden'}
              style={{ marginTop: '0px', marginBottom: '5px' }}
              onClick={() => { contract.setNextWorkflowStatus(currentVoteIndex) }}>Next status</button>

            <div style={{ marginBottom: 10, display: 'flex', flexDirection: "row", alignItems: "center", justifyContent: 'space-evenly' }}>
              <textarea className={this.inputStaged[this.getCurrentState()].vis() ? 'visible' : 'hidden'}
                id="stdInput"
                type="text"
                placeholder={this.inputStaged[this.getCurrentState()].txt} style={{ marginRight: 5 }}></textarea>
              <button className={this.onClickStaged[this.getCurrentState()].vis() ? 'visible' : 'hidden'}
                onClick={this.onClickStaged[this.getCurrentState()].cb}
                style={{ maxWidth: 80 }}>{this.onClickStaged[this.getCurrentState()].txt}</button>
            </div>
            <Table id='proposalTable'
              updateOn={this.props.Votes}
              maxHeight={195}
              maxWidth={250}
              data={this.hasProposal() ? this.props.Proposals[currentVoteIndex] : []}
              columnsHandler={['Proposal']}
              ref={this.proposalTableRef}
              fixedSelection={this.hasState(5) ? undefined : this.hasVoted() ? this.props.Votes[currentVoteIndex].votedIndex : this.hasState(3) || this.hasState(4) ? undefined : -1}
              visible={this.hasProposal()} />
          </div>
          <div className={this.getCurrentState()===5 ? 'visible' : 'hidden'}
               style={{display: this.getCurrentState()===5 ? 'flex' : 'none',
                       flexDirection: "column",
                       alignItems: 'center',
                       justifyContent: 'center',}}>
            <p style={{marginBottom: '4px'}}>The winning proposal is:</p>
            <p style={{fontFamily: 'cursive'}}>{this.getCurrentState()===5 ? this.props.Proposals[currentVoteIndex][Votes[currentVoteIndex].winningProposal].Proposal : ''}</p>
          </div>
        </div>
      </div>
    )
  }
}

export default ConnectedView;