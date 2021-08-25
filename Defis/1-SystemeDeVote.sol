// Defis/1-SystemeDeVote.sol
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
    uint private winningProposalId;
    // Status ID
    WorkflowStatus private StatusId = WorkflowStatus.RegisteringVoters;
    //Voter mapping
    mapping (address => Voter) private Voters;
    uint private votersCount;
    // Proposal listing
    Proposal[] private Proposals;
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
    
    modifier onlyRegistered(){
        require(Voters[msg.sender].isRegistered, 'Listed: caller has not been registered by the owner');
        _;
    }
    
    // I decided to use only one function insteed of specific status setter like "setProposalsRegistrationStartedStatus"
    // It ensure the owner respect the defined workflow.
    function setNextWorkflowStatus() public onlyOwner{
        require(StatusId != WorkflowStatus.VotesTallied, 'The vote is already done');
        // keep the old status for the "WorkflowStatusChange" event.
        WorkflowStatus oldStatus = StatusId;
        
        // State machine for the status workflow
        // 0_ Voters registration by the owner.
        // 0 => 1_ I defined a minimum of two voters, otherwise the vote would not be necessary.
        // Proposals registration for they registered address.
        if (StatusId==WorkflowStatus.RegisteringVoters){
            require(votersCount>=2, 'We should have at least two voters to continue the workflow');
            StatusId = WorkflowStatus.ProposalsRegistrationStarted;
            emit ProposalsRegistrationStarted();
        }
        // 1 => 2_ I defined a minimum of one proposal because it's the minimum to have an outcome.
        // Close the registration period.
        else if (StatusId==WorkflowStatus.ProposalsRegistrationStarted){
            require(Proposals.length>=1, 'We should have at least one Proposal to continue the workflow');
            StatusId = WorkflowStatus.ProposalsRegistrationEnded;
            emit ProposalsRegistrationEnded();
        }
        // 2 => 3_ I did not launch the voting session right afterwards to let the voters see the proposals
        // Open the vote.
        else if (StatusId==WorkflowStatus.ProposalsRegistrationEnded){
            StatusId = WorkflowStatus.VotingSessionStarted;
            emit VotingSessionStarted();
        }
        // 3 => 4_ Close the vote
        else if (StatusId==WorkflowStatus.VotingSessionStarted){
            StatusId = WorkflowStatus.VotingSessionEnded;
            emit VotingSessionEnded();
        }
            // 4 => 5_ I did not launch the votes counting right after the VotingSessionEnded because there is two separated points in the exercice.
            // But all results are publique so the suspense would not be there anyway.
        else if (StatusId==WorkflowStatus.VotingSessionEnded){
            // Vote counting. If there is a tie, the last of those wins.
            uint maxVoteCount = 0;
            for (uint i=0; i<Proposals.length; i++){
                if (maxVoteCount<Proposals[i].voteCount){
                    winningProposalId = i;
                    maxVoteCount = Proposals[i].voteCount;
                }
            }
            StatusId = WorkflowStatus.VotesTallied;
            emit VotesTallied();
        }
        emit WorkflowStatusChange(oldStatus, StatusId);
    }
    
    // Get the current status of the vote as an ID (not very human readeable)
    function getWorkflowStatus() public view onlyRegistered returns (WorkflowStatus) {
        return StatusId;
    }
    
    // Let the owner to register any etherum address to take part in the vote.
    function authorize( address _address) public onlyOwner{
        require(StatusId==WorkflowStatus.RegisteringVoters, 'Unable to register anyone after the RegisteringVoters workflow status');
        require(Voters[_address].isRegistered==false, 'Address already registered');
        Voters[_address] = Voter({isRegistered: true, hasVoted: false, votedProposalId: 0});
        // The vote counter exists to ensure that there is a minimum of two. 
        votersCount++;
        emit VoterRegistered(_address);
    }
    
    // Registered address can add any proposition description at multiple times
    function newProposal(string memory description) public onlyRegistered{
        require(StatusId==WorkflowStatus.ProposalsRegistrationStarted, 'Unable to register any proposals. Proposals Registration not started or already ended');
        Proposals.push(Proposal({description: description, voteCount:0}));
        emit ProposalRegistered(Proposals.length-1);
    }
    
    // Registered address can vote for one of the registered proposals
    function vote(uint votedProposalId) public onlyRegistered{
        require(StatusId==WorkflowStatus.VotingSessionStarted, 'Unable to vote while the current workflow status is not VotingSessionStarted');
        require(Voters[msg.sender].hasVoted==false, 'You can t vote twice');
        require(Proposals.length>votedProposalId, 'votedProposalId doesn t exist');
        Proposals[votedProposalId].voteCount++;
        Voters[msg.sender].hasVoted = true;
        Voters[msg.sender].votedProposalId = votedProposalId;
        emit Voted(msg.sender, votedProposalId);
    }
    
    // Some usefull getter
    function getProposalDescriptionById(uint ProposalId) public view onlyRegistered returns (string memory){
        require(Proposals.length>ProposalId, 'votedProposalId doesn t exist');
        return Proposals[ProposalId].description;
    }
    
    // As explaned in the exercise, everyone can check the final details of the winning proposal so i did'n put the onlyRegistered modifier.
    function getWinningProposalDescription() public view returns (string memory){
        require(StatusId==WorkflowStatus.VotesTallied, 'Vote not tallied yet');
        return getProposalDescriptionById(winningProposalId);
    }
    
    function getProposalVoteCountById(uint ProposalId) public view onlyRegistered returns (uint){
        require(Proposals.length>ProposalId, 'votedProposalId doesn t exist');
        return Proposals[ProposalId].voteCount;
    }
    
    function getVotedProposalIdByAddress(address _address) public view onlyRegistered returns (uint){
        require(StatusId==WorkflowStatus.VotesTallied || StatusId==WorkflowStatus.VotingSessionStarted || StatusId==WorkflowStatus.VotingSessionEnded, 'Vote not started yet');
        require(Voters[_address].hasVoted, 'This address has not voted');
        return Voters[_address].votedProposalId;
    }
    
}