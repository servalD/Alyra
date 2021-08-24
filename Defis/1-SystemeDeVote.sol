// contracts/Defi_SystemeDeVote.sol
// SPDX-License-Identifier: MIT

pragma solidity 0.8.0;

// Works directly pre-mixed by the statement of the exercise
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/access/Ownable.sol";

contract Voting is Ownable{
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
    // Winner ID
    uint winningProposalId;
    // Status ID
    WorkflowStatus StatusId = WorkflowStatus.RegisteringVoters;
    //Voter mapping
    mapping (address => Voter) Voters;
    uint votersCount;
    // Proposal listing
    Proposal[] Proposals;
    // Events
    event VoterRegistered(address voterAddress);
    event ProposalsRegistrationStarted();
    event ProposalsRegistrationEnded();
    event ProposalRegistered(uint proposalId);
    event VotingSessionStarted();
    event VotingSessionEnded();
    event Voted (address voter, uint proposalId);
    event VotesTallied();
    event WorkflowStatusChange(WorkflowStatus previousStatus, WorkflowStatus newStatus);
    // My work
    // 
    modifier onlyRegistered(){
        require(Voters[msg.sender].isRegistered, 'Listed: caller has not been registered by the owner');
        _;
    }
    
    function setNextWorkflowStatus() public onlyOwner{
        require(StatusId != WorkflowStatus.VotesTallied, 'The vote is already done');
        WorkflowStatus oldStatus = StatusId;
        if (StatusId==WorkflowStatus.RegisteringVoters){
            require(votersCount>=2, 'We should have at least two voters to continue the workflow');
            StatusId = WorkflowStatus.ProposalsRegistrationStarted;
            emit ProposalsRegistrationStarted();
        }
        else if (StatusId==WorkflowStatus.ProposalsRegistrationStarted){
            require(Proposals.length>=1, 'We should have at least one Proposal to continue the workflow');
            StatusId = WorkflowStatus.ProposalsRegistrationEnded;
            emit ProposalsRegistrationEnded();
        }
        else if (StatusId==WorkflowStatus.ProposalsRegistrationEnded){
            StatusId = WorkflowStatus.VotingSessionStarted;
            emit VotingSessionStarted();
        }
        else if (StatusId==WorkflowStatus.VotingSessionStarted){
            StatusId = WorkflowStatus.VotingSessionEnded;
            emit VotingSessionEnded();
        }
        else if (StatusId==WorkflowStatus.VotingSessionEnded){
            StatusId = WorkflowStatus.VotesTallied;
            uint maxVoteCount = 0;
            for (uint i=0; i<Proposals.length; i++){
                if (maxVoteCount<Proposals[i].voteCount){
                    winningProposalId = i;
                    maxVoteCount = Proposals[i].voteCount;
                }
            }
            
            emit VotesTallied();
        }
        emit WorkflowStatusChange(oldStatus, StatusId);
    }
    
    function getWorkflowStatus() public view returns (WorkflowStatus) {
        return StatusId;
    }
    
    function authorize( address _address) public onlyOwner{
        require(StatusId==WorkflowStatus.RegisteringVoters, 'Unable to register anyone after the RegisteringVoters workflow status');
        require(Voters[_address].isRegistered==false, 'Address already registered');
        Voters[_address] = Voter({isRegistered: true, hasVoted: false, votedProposalId: 0});
        votersCount++;
        emit VoterRegistered(_address);
    }
    
    function newProposal(string memory description) public onlyRegistered{
        require(StatusId==WorkflowStatus.ProposalsRegistrationStarted, 'Unable to register any proposals. Proposals Registration not started or already ended');
        Proposals.push(Proposal({description: description, voteCount:0}));
        emit ProposalRegistered(Proposals.length-1);
    }
    
    function vote(uint votedProposalId) public onlyRegistered{
        require(StatusId==WorkflowStatus.VotingSessionStarted, 'Unable to vote while the current workflow status is not VotingSessionStarted');
        require(Voters[msg.sender].hasVoted==false, 'You can t vote twice');
        require(Proposals.length>votedProposalId, 'votedProposalId doesn t exist');
        Proposals[votedProposalId].voteCount++;
        Voters[msg.sender].hasVoted = true;
        Voters[msg.sender].votedProposalId = votedProposalId;
        emit Voted(msg.sender, votedProposalId);
    }
    
    function getProposalDescriptionById(uint ProposalId) public view returns (string] memory){
        require(Proposals.length>votedProposalId, 'votedProposalId doesn t exist');
        return Proposals[ProposalId].description;
    }
    
    function getWinningProposalDescription() public view returns (string memory){
        require(StatusId==WorkflowStatus.VotesTallied, 'Vote not tallied yet');
        return getProposalDescriptionById(winningProposalId);
    }
    
    function getVotedProposalIdByAddress(address _address) public view returns (uint){
        require(Voters[_address].hasVoted, '');
        return Voters[_address].votedProposalId;
    }

}