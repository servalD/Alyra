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

    // Enumeration
    enum WorkflowStatus {
        RegisteringVoters,
        ProposalsRegistrationStarted,
        ProposalsRegistrationEnded,
        VotingSessionStarted,
        VotingSessionEnded,
        VotesTallied
    } 
    
    mapping (uint => Vote) votes;// Maps use less gas than arrays
    uint private votesCount;// So a counter is associated to retrive votes
    
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

    modifier onlyOwner(uint index){
        require(_isOwner(index, msg.sender), '0');//Ownable: caller can be only the owner of the vote
        _;
    }

     modifier onlyRegistered(uint index){
        require(votes[index].voters[msg.sender].isRegistered, '1');//Listed: caller has not been registered by the owner
        _;
    }

    // For internal calls, the sender address should be retrived from the top call
    function _isOwner(uint index, address _address) private view returns (bool) {
        return votes[index].owner==_address;
    }

    modifier onlyRegisteredOrOwner(uint index){
        require(votes[index].owner==msg.sender || votes[index].voters[msg.sender].isRegistered, '2');//Ownable or listed only
        _;
    }

    // Setter and interaction functions //
    // Add a new vote to the list
    function newVote(string memory tips) external {// Everyone can add a new vote
        require(bytes(tips).length>0, '3');//Tips should not be empty //didn't accept empty tips
        votes[votesCount].tips = tips;
        votes[votesCount].owner = msg.sender;
        emit VoteCreated(votesCount);
        votesCount+=1;
    }

    // I decided to use only one function insteed of specific status setter like "setProposalsRegistrationStartedStatus"
    function setNextWorkflowStatus(uint index) external onlyOwner(index){
        
        require(votes[index].statusId != WorkflowStatus.VotesTallied, '4');//The vote is already done
        // keep the old status for the "WorkflowStatusChange" event.
        WorkflowStatus oldStatus = votes[index].statusId;
        
        // State machine for the status workflow
        // 0_ Voters registration by the owner.
        // 0 => 1_ I defined a minimum of two voters, otherwise the vote would not be necessary.
        // Proposals registration for they registered address.
        if (votes[index].statusId==WorkflowStatus.RegisteringVoters){
            require(votes[index].votersCount>=2, '5');//We should have at least two voters to continue the workflow
            votes[index].statusId = WorkflowStatus.ProposalsRegistrationStarted;
            emit ProposalsRegistrationStarted(index);
        }
        // 1 => 2_ I defined a minimum of one proposal because it's the minimum to have an outcome.
        // Close the registration period.
        else if (votes[index].statusId==WorkflowStatus.ProposalsRegistrationStarted){
            require(votes[index].proposals.length>=1, '6');//We should have at least one Proposal to continue the workflow
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
    
    // Let a vote owner to register any etherum address to take part in the votes.
    function authorize( uint index, address _address) external onlyOwner(index){
        
        require(votes[index].statusId==WorkflowStatus.RegisteringVoters, '7');//Unable to register anyone after the RegisteringVoters workflow status
        require(votes[index].voters[_address].isRegistered==false, '8');//Address already registered
        votes[index].voters[_address] = Voter({isRegistered: true, hasVoted: false, votedProposalId: 0});
        // The voter counter exists to ensure that there is a minimum of two. 
        votes[index].votersCount++;
        emit VoterRegistered(index, _address);
    }
    
    // Registered address can add any proposition description at multiple times
    function newProposal(uint index, string memory description) external onlyRegistered(index){
        require(votes[index].statusId==WorkflowStatus.ProposalsRegistrationStarted, '9');//Unable to register any proposals. Proposals Registration not started or already ended
        votes[index].proposals.push(Proposal({description: description, voteCount:0}));
        emit ProposalRegistered(index, votes[index].proposals.length-1);
    }
    
    // Registered address can vote once for a registered proposals
    function doVote(uint index, uint votedProposalId) external onlyRegistered(index){
        
        require(votes[index].statusId==WorkflowStatus.VotingSessionStarted, '10');//Unable to vote while the current workflow status is not VotingSessionStarted
        require(votes[index].voters[msg.sender].hasVoted==false, '11');//You can t vote twice
        require(votes[index].proposals.length>votedProposalId, '12');//votedProposalId doesn t exist
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

    function getVoteCount() external view returns (uint){
        return votesCount;
    }

    // get the vote purpos at the given index
    function getVoteTips(uint index) external view returns(string memory){
        require(votesCount>index, "13");//Given vote index doesn't exist
        return votes[index].tips;
    }

    // Ask if the sender is the vote owner
    function isOwner(uint index) external view returns(bool){
        require(votesCount>index, "13");
        return votes[index].owner==msg.sender;
    }

    // Ask if the sender has been registered in the vote by the owner
    function isRegistered(uint index) external view returns(bool){
        require(votesCount>index, "13");
        return votes[index].voters[msg.sender].isRegistered;
    }

    // Get the current status of the vote as an ID (not very human readeable)
    function getWorkflowStatus(uint index) external view returns (WorkflowStatus) {
        require(votesCount>index, "13");
        return votes[index].statusId;
    }

    function getProposalCount(uint index) external view returns(uint){
        require(votesCount>index, "13");
        return votes[index].proposals.length;
    }

    function getProposalDescriptionById(uint index, uint ProposalId) public view returns (string memory){
        require(votesCount>index, "13");
        require(votes[index].proposals.length>ProposalId, '12');
        return votes[index].proposals[ProposalId].description;
    }
    
    // As explaned in the exercise, everyone can check the final details of the winning proposal so i did'n put the onlyRegistered modifier.
    function getWinningProposalDescription(uint index) external view returns (string memory){
        require(votesCount>index, "13");
        require(votes[index].statusId==WorkflowStatus.VotesTallied, '15');//Vote not tallied yet
        return getProposalDescriptionById(index, votes[index].winningProposalId);
    }
    
    function getProposalVoteCountById(uint index, uint ProposalId) external view onlyRegisteredOrOwner(index) returns (uint){
        require(votesCount>index, "13");
        require(votes[index].proposals.length>ProposalId, '12');
        return votes[index].proposals[ProposalId].voteCount;
    }
    
    function getVotedProposalIdByAddress(uint index, address _address) external view returns (int){
        require(votesCount>index, "13");
        require(votes[index].statusId==WorkflowStatus.VotesTallied || votes[index].statusId==WorkflowStatus.VotingSessionStarted || votes[index].statusId==WorkflowStatus.VotingSessionEnded, 'Vote not started yet');
        require(votes[index].voters[_address].hasVoted, '14');//This address has not voted
        return int(votes[index].voters[_address].votedProposalId);
    }

    function hasVoted(uint index, address _address) external view  returns (bool){
        require(votesCount>index, "13");
        return votes[index].voters[_address].hasVoted;
    }

    // get front vote informations
    function getFullPersonalVoteInfo(uint index) external view returns(string memory, uint, bool, int, bool, uint){
        require(votesCount>index, "13");
        string memory tips = votes[index].tips;
        uint state = uint(this.getWorkflowStatus(index));
        bool registered = votes[index].voters[msg.sender].isRegistered;
        int votedIndex = -1;
        uint winningProposalId = 0;
        if (registered && this.hasVoted(index, msg.sender)){
            votedIndex = this.getVotedProposalIdByAddress(index, msg.sender);
            winningProposalId = votes[index].winningProposalId;
        }
        
        bool owner = _isOwner(index, msg.sender);
        return (tips, state, registered, votedIndex, owner, winningProposalId);
    }
    
}
