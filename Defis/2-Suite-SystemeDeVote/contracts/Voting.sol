// contracts/Defi_SystemeDevotes[index].sol
// SPDX-License-Identifier: MIT

pragma solidity 0.8.7;
 
contract Voting {
    // Structures
    struct Voter {
        bool isRegistered;
        bool hasVoted;
        uint votedProposalId;
    }
      
    struct Proposal {
        string description;
        uint voteCount;
    }
    
    // Enumeration
    enum WorkflowStatus {
        RegisteringVoters,
        ProposalsRegistrationStarted,
        ProposalsRegistrationEnded,
        VotingSessionStarted,
        VotingSessionEnded,
        VotesTallied
    } 
    
    // vote mapping
    struct Vote{
        // Subject of the vote
        string tips;
        // Owner address
        address owner;
        // Winner ID
        uint winningProposalId;
        // Status ID
        WorkflowStatus statusId;
        //Voter mapping
        mapping (address => Voter) voters;
        uint votersCount;
        // Proposal listing
        Proposal[] proposals;
        uint maxVoteCount;
    }
    mapping (uint => Vote) votes;
    uint private votesCount;
    
    // Events
    event VoteCreated(uint voteIndex);
    event VoterRegistered(uint voteIndex, address voterAddress);
    event ProposalsRegistrationStarted(uint voteIndex);
    event ProposalsRegistrationEnded(uint voteIndex);
    event ProposalRegistered(uint voteIndex, uint proposalId);
    event VotingSessionStarted(uint voteIndex);
    event VotingSessionEnded(uint voteIndex);
    event Voted (uint voteIndex, address voter, uint proposalId);
    event VotesTallied(uint voteIndex);
    event WorkflowStatusChange(uint voteIndex, WorkflowStatus previousStatus, WorkflowStatus newStatus);
    event log(address out);
    // My work
    
    modifier onlyRegistered(uint index){
        require(votes[index].voters[msg.sender].isRegistered, 'Listed: caller has not been registered by the owner');
        _;
    }

    // Ask if the sender if the vote owner
    function isRegistered(uint index) external view returns(bool){
        return votes[index].voters[msg.sender].isRegistered;
    }

    modifier onlyOwner(uint index){
        // emit log(votes[index].owner);
        // emit log(msg.sender);
        require(_isOwner(index, msg.sender), 'Ownable: caller can be only the owner of the vote');
        _;
    }

    // Ask if the sender if the vote owner
    function isOwner(uint index) external view returns(bool){
        return votes[index].owner==msg.sender;
    }

    function _isOwner(uint index, address _address) private view returns (bool) {
        return votes[index].owner==_address;
    }

    modifier onlyRegisteredOrOwner(uint index){
        require(votes[index].owner==msg.sender || votes[index].voters[msg.sender].isRegistered, 'Ownable or listed only');
        _;
    }

    // Vote structure management
    // Add a new vote to the pool
    function newVote(string memory tips) external {
        votes[votesCount].tips = tips;
        votes[votesCount].owner = msg.sender;
        emit VoteCreated(votesCount);
        votesCount+=1;
    }
    // Internal mecanisems : 
    // function 
    // Externals mechanismes
    // get the number of vote created

    // I decided to use only one function insteed of specific status setter like "setProposalsRegistrationStartedStatus"
    // It ensure the owner respect the defined workflow.
    function setNextWorkflowStatus(uint index) external onlyOwner(index){
        
        require(votes[index].statusId != WorkflowStatus.VotesTallied, 'The vote is already done');
        // keep the old status for the "WorkflowStatusChange" event.
        WorkflowStatus oldStatus = votes[index].statusId;
        
        // State machine for the status workflow
        // 0_ Voters registration by the owner.
        // 0 => 1_ I defined a minimum of two voters, otherwise the vote would not be necessary.
        // Proposals registration for they registered address.
        if (votes[index].statusId==WorkflowStatus.RegisteringVoters){
            require(votes[index].votersCount>=2, 'We should have at least two voters to continue the workflow');
            votes[index].statusId = WorkflowStatus.ProposalsRegistrationStarted;
            emit ProposalsRegistrationStarted(index);
        }
        // 1 => 2_ I defined a minimum of one proposal because it's the minimum to have an outcome.
        // Close the registration period.
        else if (votes[index].statusId==WorkflowStatus.ProposalsRegistrationStarted){
            require(votes[index].proposals.length>=1, 'We should have at least one Proposal to continue the workflow');
            votes[index].statusId = WorkflowStatus.ProposalsRegistrationEnded;
            emit ProposalsRegistrationEnded(index);
        }
        // 2 => 3_ I did not launch the voting session right afterwards to let the voters see the proposals
        // Open the votes[index].
        else if (votes[index].statusId==WorkflowStatus.ProposalsRegistrationEnded){
            votes[index].statusId = WorkflowStatus.VotingSessionStarted;
            emit VotingSessionStarted(index);
        }
        // 3 => 4_ Close the vote
        else if (votes[index].statusId==WorkflowStatus.VotingSessionStarted){
            votes[index].statusId = WorkflowStatus.VotingSessionEnded;
            emit VotingSessionEnded(index);
        }
            // 4 => 5_ I did not launch the votes counting right after the VotingSessionEnded because there is two separated points in the exercice.
            // But all results are publique so the suspense would not be there anyway.
        else if (votes[index].statusId==WorkflowStatus.VotingSessionEnded){

            votes[index].statusId = WorkflowStatus.VotesTallied;
            emit VotesTallied(index);
        }
        emit WorkflowStatusChange(index, oldStatus, votes[index].statusId);
    }
    
    // Get the current status of the vote as an ID (not very human readeable)
    function getWorkflowStatus(uint index) external view returns (WorkflowStatus) {
        return votes[index].statusId;
    }
    
    // Let the owner to register any etherum address to take part in the votes[index].
    function authorize( uint index, address _address) external onlyOwner(index){
        
        require(votes[index].statusId==WorkflowStatus.RegisteringVoters, 'Unable to register anyone after the RegisteringVoters workflow status');
        require(votes[index].voters[_address].isRegistered==false, 'Address already registered');
        votes[index].voters[_address] = Voter({isRegistered: true, hasVoted: false, votedProposalId: 0});
        // The vote counter exists to ensure that there is a minimum of two. 
        votes[index].votersCount++;
        emit VoterRegistered(index, _address);
    }

    function autorized(uint index, address _address) external view returns (bool){
        return votes[index].voters[_address].isRegistered;
    }
    
    // Registered address can add any proposition description at multiple times
    function newProposal(uint index, string memory description) external onlyRegistered(index){
        
        require(votes[index].statusId==WorkflowStatus.ProposalsRegistrationStarted, 'Unable to register any proposals. Proposals Registration not started or already ended');
        votes[index].proposals.push(Proposal({description: description, voteCount:0}));
        emit ProposalRegistered(index, votes[index].proposals.length-1);
    }
    
    // Registered address can vote for one of the registered proposals
    function doVote(uint index, uint votedProposalId) external onlyRegistered(index){
        
        require(votes[index].statusId==WorkflowStatus.VotingSessionStarted, 'Unable to vote while the current workflow status is not VotingSessionStarted');
        require(votes[index].voters[msg.sender].hasVoted==false, 'You can t vote twice');
        require(votes[index].proposals.length>votedProposalId, 'votedProposalId doesn t exist');
        votes[index].proposals[votedProposalId].voteCount++;
        votes[index].voters[msg.sender].hasVoted = true;
        votes[index].voters[msg.sender].votedProposalId = votedProposalId;
        votes[index].proposals[votedProposalId].voteCount += 1;
        // Check the winning proposal
        if (votes[index].maxVoteCount<votes[index].proposals[votedProposalId].voteCount){
            votes[index].winningProposalId = votedProposalId;
            votes[index].maxVoteCount = votes[index].proposals[votedProposalId].voteCount;
        }
        emit Voted(index, msg.sender, votedProposalId);
    }
    
    // Some usefull getter
    function getProposalCount(uint index) external view returns(uint){
        return votes[index].proposals.length;
    }//onlyRegisteredOrOwner(index)
    function getProposalDescriptionById(uint index, uint ProposalId) public view returns (string memory){
        require(votes[index].proposals.length>ProposalId, 'votedProposalId doesn t exist');
        return votes[index].proposals[ProposalId].description;
    }
    
    // As explaned in the exercise, everyone can check the final details of the winning proposal so i did'n put the onlyRegistered modifier.
    function getWinningProposalDescription(uint index) external view returns (string memory){
        require(votes[index].statusId==WorkflowStatus.VotesTallied, 'Vote not tallied yet');
        return getProposalDescriptionById(index, votes[index].winningProposalId);
    }
    
    function getProposalVoteCountById(uint index, uint ProposalId) external view onlyRegisteredOrOwner(index) returns (uint){
        require(votes[index].proposals.length>ProposalId, 'votedProposalId doesn t exist');
        return votes[index].proposals[ProposalId].voteCount;
    }
    
    function getVotedProposalIdByAddress(uint index, address _address) external view returns (int){//onlyRegisteredOrOwner(index)
        
        require(votes[index].statusId==WorkflowStatus.VotesTallied || votes[index].statusId==WorkflowStatus.VotingSessionStarted || votes[index].statusId==WorkflowStatus.VotingSessionEnded, 'Vote not started yet');
        require(votes[index].voters[_address].hasVoted, 'This address has not voted');
        return int(votes[index].voters[_address].votedProposalId);
    }

    function hasVoted(uint index, address _address) external view  returns (bool){//onlyRegisteredOrOwner(index)
        return votes[index].voters[_address].hasVoted;
    }

    function getVoteCount() external view returns (uint){
        return votesCount;
    }
    // get the vote purpos at the given index
    function getVoteTips(uint index) external view returns(string memory){
        return votes[index].tips;
    }

    // get front vote informations
    function getFullPersonalVoteInfo(uint index) external view returns(string memory, uint, bool, int, bool, uint){
        string memory tips = votes[index].tips;
        uint state = uint(this.getWorkflowStatus(index));
        bool registered = votes[index].voters[msg.sender].isRegistered;
        int votedIndex = -1;
        uint winningProposalId = 0;
        if (registered && this.hasVoted(index, msg.sender)){
            votedIndex = this.getVotedProposalIdByAddress(index, msg.sender);//onlyRegisteredOrOwner(index)
            winningProposalId = votes[index].winningProposalId;
        }
        
        bool owner = _isOwner(index, msg.sender);
        return (tips, state, registered, votedIndex, owner, winningProposalId);
    }
    
}
