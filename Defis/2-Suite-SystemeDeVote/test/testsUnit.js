const Voting = artifacts.require("./Voting.sol");
const truffleAssert = require('truffle-assertions');

contract("Voting", accounts => {
  let VotingInstance;

  beforeEach("should setup the contract instance", async () => {
    VotingInstance = await Voting.deployed();
  });

  it("Should create a new vote and test these getter", async () => {
    await truffleAssert.passes(VotingInstance.newVote("Which restaurent at lunch ?", { from: accounts[0] }) , "Creating new vote...");
    assert.equal( await VotingInstance.getVoteCount({ from: accounts[0] }), 1, "Testing the counter");
    assert.equal( await VotingInstance.getVoteTips(0, { from: accounts[0] }), "Which restaurent at lunch ?", "Testing the tips");
  });

  it("Should register a new member to the vote index 0", async () => {
    const voteIntex = 0;
    const addr = accounts[1];
    
    await VotingInstance.authorize(voteIntex, addr, { from: accounts[0] });
    assert.equal(await VotingInstance.autorized(voteIntex, addr, { from: accounts[0] }), true, "address:  "+addr+"\nshould be autorized.");
  });

  it("Should test the complet workflow", async () => {
    await VotingInstance.newVote("Which crypto to hold ?", { from: accounts[1] })
    assert.equal( await VotingInstance.getVoteCount({ from: accounts[0] }), 2, "Testing the counter");
    await VotingInstance.authorize(0, accounts[0], { from: accounts[0] });
    await VotingInstance.authorize(0, accounts[2], { from: accounts[0] });
    await VotingInstance.authorize(0, accounts[3], { from: accounts[0] }); 

    await VotingInstance.authorize(1, accounts[0], { from: accounts[1] });
    await VotingInstance.authorize(1, accounts[1], { from: accounts[1] });
    await VotingInstance.authorize(1, accounts[2], { from: accounts[1] });
    await VotingInstance.authorize(1, accounts[3], { from: accounts[1] });
    await VotingInstance.authorize(1, accounts[4], { from: accounts[1] });

    assert.equal(await VotingInstance.autorized(0, accounts[2], { from: accounts[0] }), true, "address:  "+accounts[2]+"\nshould be autorized.");
    
    await truffleAssert.reverts(VotingInstance.authorize(0, accounts[3], { from: accounts[1] }));//not owner registering
    await truffleAssert.reverts(VotingInstance.authorize(0, accounts[2], { from: accounts[0] }));//Registering an address twice times
    
    assert.equal( await VotingInstance.getWorkflowStatus(0, { from: accounts[0] }), 0, "Workflow status at 0, registering member");
    await VotingInstance.setNextWorkflowStatus(0, { from: accounts[0] })
    assert.equal( await VotingInstance.getWorkflowStatus(0, { from: accounts[0] }), 1, "Workflow status at 1, proposal phase");

    await VotingInstance.setNextWorkflowStatus(1, { from: accounts[1] })

    await VotingInstance.newProposal(0, "chinois", { from: accounts[0] })
    await VotingInstance.newProposal(0, "libanais", { from: accounts[0] })
    await VotingInstance.newProposal(0, "kebab", { from: accounts[0] })

    await VotingInstance.newProposal(1, "SOL", { from: accounts[1] })
    await VotingInstance.newProposal(1, "ETH", { from: accounts[1] })
    await VotingInstance.newProposal(1, "MATIC", { from: accounts[1] })
    await VotingInstance.newProposal(1, "XTZ", { from: accounts[1] })

    assert.equal(await VotingInstance.getProposalDescriptionById(0, 1, { from: accounts[0] }), "libanais", "test the restorant");
    
    await VotingInstance.setNextWorkflowStatus(0, { from: accounts[0] })
    await VotingInstance.setNextWorkflowStatus(1, { from: accounts[1] })

    await VotingInstance.setNextWorkflowStatus(0, { from: accounts[0] })
    await VotingInstance.setNextWorkflowStatus(1, { from: accounts[1] })
    
    await VotingInstance.doVote(0, 1, { from: accounts[0] })
    await VotingInstance.doVote(0, 1, { from: accounts[1] })
    await VotingInstance.doVote(0, 2, { from: accounts[2] })
    await VotingInstance.doVote(0, 0, { from: accounts[3] })

    await VotingInstance.doVote(1, 2, { from: accounts[1] })
    await VotingInstance.doVote(1, 0, { from: accounts[2] })
    await VotingInstance.doVote(1, 0, { from: accounts[3] })
    await VotingInstance.doVote(1, 1, { from: accounts[4] })
    // assert.equal(await truffleAssert.getProposalVoteCountById()
    
  });
});