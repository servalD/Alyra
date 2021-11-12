import React, { Component } from "react";
import Table from './Table/Table';
import VotingWrapper from "../contracts/VotingWrapper";

class ConnectedView extends Component {
  // This component is only displayed if the contract is nicely interfaced.
  constructor(props) {
    super(props)
    this.proposalTableRef = React.createRef()
    this.voteTableRef = React.createRef()
    this.onClickStaged = {// To keep only one button on the vote interacion div, so it maps each onClick, text and visibility by status id
      10: { cb: undefined, txt: "", vis: () => false },
      0: {
        cb: () => { this.props.contract.authorize(this.props.currentVoteIndex, document.getElementById('stdInput').value) },
        txt: "Register new member",
        vis: () => this.isOwner()
      },
      1: {
        cb: () => { this.props.contract.newProposal(this.props.currentVoteIndex, document.getElementById('stdInput').value) },
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
    return this.props.data.length > 0;
  }

  hasProposal() {
    if (this.hasVote() && this.props.tablesDatasProposals[this.props.currentVoteIndex]) return this.props.tablesDatasProposals[this.props.currentVoteIndex].length;
    else return false;
  }

  hasVoted() {
    if (this.hasVote()) return this.props.data[this.props.currentVoteIndex].votedIndex > -1;
    else return false;
  }

  isOwner() {
    if (this.hasVote()) return this.props.data[this.props.currentVoteIndex].owner;
    else return false;
  }

  isRegistered() {
    if (this.hasVote()) return this.props.data[this.props.currentVoteIndex].Registered;
  }

  hasState(state) {
    if (this.hasVote()) return this.props.data[this.props.currentVoteIndex].State === state;
    else return false;
  }

  getCurrentState() {
    if (this.hasVote()) return this.props.data[this.props.currentVoteIndex].State;
    else return 10;
  }

  componentDidUpdate() {
    this.props.parent.reportWindowSize()
  }

  render() {
    console.log('Render connected view')
    if (!this.props.connectionStatus) return (<p></p>);
    const { data, contract, currentVoteIndex } = this.props
    return (
      <div id={this.props.id} style={{
        marginTop: 25,
        display: 'flex',
        flexDirection: "row",
        alignItems: "center",
        justifyContent: 'space-around'
      }}>
        <div style={{ display: 'block' }}>
          <Table id='voteTable'
            maxHeight={200}
            maxWidth={500}
            data={data}
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
            <textarea id="newVoteInput" type="text" placeholder="Vote thematic" style={{ width: 400 }}></textarea>
            <button onClick={() => { contract.newVote(document.getElementById('newVoteInput').value) }} style={{ width: 95 }}>Create new vote</button>
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
            justifyContent: 'center',
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
              height={200}
              maxWidth={250}
              data={this.hasProposal() ? this.props.tablesDatasProposals[currentVoteIndex] : []}
              columnsHandler={['Proposal']}
              ref={this.proposalTableRef}
              fixedSelection={this.hasState(5) ? 'None' : this.hasVoted() ? this.props.data[currentVoteIndex].votedIndex : this.hasState(3) || this.hasState(4) ? undefined : -1}
              visible={this.hasProposal()} />
          </div>
          <div className={this.getCurrentState()===5 ? 'visible' : 'hidden'}
               style={{display: this.getCurrentState()===5 ? 'flex' : 'none',
                       flexDirection: "column",
                       alignItems: 'center',
                       justifyContent: 'center',}}>
            <p style={{marginBottom: '4px'}}>The winning proposal is:</p>
            <p style={{fontFamily: 'cursive'}}>{this.getCurrentState()===5 ? this.props.tablesDatasProposals[currentVoteIndex][data[currentVoteIndex].winningProposal].Proposal : ''}</p>
          </div>
        </div>
      </div>
    )
  }
}

export default ConnectedView;