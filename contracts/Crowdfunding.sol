// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

// Author: @Sammie
contract Crowdfunding {
    // Struct to hold information about a campaign
    struct Campaign {
        address payable creator; // Address of the campaign creator
        uint goal; // Funding goal in wei (1 ether = 10^18 wei)
        uint deadline; // Deadline for the campaign (timestamp)
        uint amountCollected; // Total amount collected so far
        bool goalReached; // True if the funding goal has been reached
        bool fundsWithdrawn; // True if the funds have been withdrawn by the creator
    }

    bool private locked; //Reentrancy guard;

    modifier noReentrancy() {
        require(!locked, "Reentrant call.");
        locked = true;
        _;
        locked = false;
    }
    // Array to store all campaigns
    Campaign[] public campaigns;

    // Mapping to track contributions by each address to each campaign
    mapping(uint => mapping(address => uint)) public contributions;

    // Event that will be emitted whenever a new campaign is created
    event CampaignCreated(
        uint campaignId,
        address creator,
        uint goal,
        uint deadline
    );

    // Event that will be emitted whenever a contribution is made
    event ContributionMade(uint campaignId, address contributor, uint amount);

    // Event that will be emitted when funds are withdrawn by the campaign creator
    event FundsWithdrawn(uint campaignId, address indexed creator, uint amount);

    // Event that will be emitted when a contributor gets a refund
    event RefundClaimed(uint campaignId, address contributor, uint amount);

    // Function to create a new campaign
    function createCampaign(uint _goal, uint _durationInDays) external {
        uint deadline = block.timestamp + (_durationInDays * 1 days); //Calculate the campaign deadline

        //Create a new campaign and add it to the array
        campaigns.push(
            Campaign({
                creator: payable(msg.sender),
                goal: _goal,
                deadline: deadline,
                amountCollected: 0,
                goalReached: false,
                fundsWithdrawn: false
            })
        );

        // Emit an event for the newly created campaign
        emit CampaignCreated(campaigns.length - 1, msg.sender, _goal, deadline);
    }

    // Function to contribute to a campaign
    function contribute(uint _campaignId) external payable {
        Campaign storage campaign = campaigns[_campaignId]; // Get the campaign from the array
        require(block.timestamp < campaign.deadline, "The campaign has ended."); // Ensure the campaign is still active
        require(
            msg.value > 0,
            "Contribution amount must be greater than zero."
        ); // Ensure a valid contribution
        campaign.amountCollected += msg.value; // Update the collected amount
        contributions[_campaignId][msg.sender] += msg.value; // Record the contribution

        // Emit the contribution event
        emit ContributionMade(_campaignId, msg.sender, msg.value);
    }

    // Function to withdraw funds
    function withdrawCampaignFunds(uint _campaignId) external noReentrancy {
        Campaign storage campaign = campaigns[_campaignId];
        require(
            block.timestamp >= campaign.deadline,
            "The campaign hasn't ended."
        ); // Ensure the campaign is over
        require(
            msg.sender == campaign.creator,
            "Only the creator of this campaign can withdraw the Funds"
        ); // Ensure only the creator can withdraw Funds
        require(!campaign.fundsWithdrawn, "Funds have already been withdrawn.");
        uint amount = campaign.amountCollected;
        require(amount > 0, "No Funds to withdraw.");
        campaign.fundsWithdrawn = true;
        campaign.amountCollected = 0;

        (bool success, ) = campaign.creator.call{value: amount}("");
        require(success, "Transfer failed.");
        emit FundsWithdrawn(_campaignId, msg.sender, amount);
    }

    function refundContribution(uint _campaignId) external {
        Campaign storage campaign = campaigns[_campaignId];

        require(block.timestamp > campaign.deadline, "Campaign not ended yet.");
        uint contribution = contributions[_campaignId][msg.sender];
        require(contribution > 0, "No contributions to refund.");
        contributions[_campaignId][msg.sender] = 0;
        (bool success, ) = payable(msg.sender).call{value: contribution}("");
        require(success, "Refund failed.");
        emit RefundClaimed(_campaignId, msg.sender, contribution);
    }
}
