// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.18;

import "@openzeppelin/contracts/utils/Counters.sol";

contract CharityPlatform {
    using Counters for Counters.Counter;

    Counters.Counter private _charityId;

    mapping(uint256 => Charity) public charities;
    mapping(uint256 => mapping(address => uint256)) public donations;

    struct Charity {
        string name;
        string description;
        uint256 fundingGoal;
        uint256 fundingRaised;
        uint256 deadline;
        address creator;
        bool fundsCollected;
    }

    event CharityCreated(
        uint256 indexed charityId,
        string name,
        uint256 fundingGoal,
        uint256 deadline
    );

    event DonationMade(
        uint256 indexed charityId,
        address indexed donator,
        uint256 amount
    );

    event CollectedFunds(
        uint256 indexed charityId,
        address indexed receiver,
        uint256 amount
    );

    event Refund(
        uint256 indexed charityId,
        address indexed receiver,
        uint256 amount
    );

    modifier onlyActive(uint256 charityId) {
        require(
            charities[charityId].fundingGoal >
                charities[charityId].fundingRaised,
            "Funds raised"
        );
        require(
            charities[charityId].deadline > block.timestamp,
            "Deadline passed"
        );
        _;
    }

    function createCharity(
        string memory _name,
        string memory _description,
        uint256 _fundingGoal,
        uint256 _deadline
    ) external {
        require(_deadline > block.timestamp, "Deadline in the future");
        require(_fundingGoal != 0, "Funding != 0");

        uint256 newCharityId = _charityId.current();

        Charity memory charity = Charity(
            _name,
            _description,
            _fundingGoal,
            0,
            _deadline,
            msg.sender,
            false
        );

        charities[newCharityId] = charity;
        _charityId.increment();

        emit CharityCreated(newCharityId, _name, _fundingGoal, _deadline);
    }

    function donate(uint256 charityId) external payable onlyActive(charityId) {
        require(
            charities[charityId].fundingGoal >=
                msg.value + charities[charityId].fundingRaised,
            "Cannot exceed funding goal"
        );

        charities[charityId].fundingRaised += msg.value;
        donations[charityId][msg.sender] += msg.value;

        emit DonationMade(charityId, msg.sender, msg.value);
    }

    function collectFunds(uint256 charityId, address receiver) external {
        require(!isActive(charityId), "Charity is active");
        require(msg.sender == charities[charityId].creator, "Not the creator");
        require(
            charities[charityId].fundsCollected == false,
            "Already collected"
        );

        charities[charityId].fundsCollected = true;

        emit CollectedFunds(
            charityId,
            receiver,
            charities[charityId].fundingRaised
        );

        (bool success, ) = receiver.call{
            value: charities[charityId].fundingRaised
        }("");
        require(success, "Failed to collect funds");
    }

    function refund(uint256 charityId) external payable {
        Charity memory charity = charities[charityId];
        require(
            charity.fundingRaised < charity.fundingGoal,
            "Funding goal reached"
        );
        require(charity.deadline < block.timestamp, "Deadline not passed");
        require(donations[charityId][msg.sender] > 0, "Donation not made");

        uint256 amount = donations[charityId][msg.sender];
        donations[charityId][msg.sender] = 0;

        emit Refund(charityId, msg.sender, amount);

        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Failed to refund");
    }

    function isActive(uint256 charityId) private view returns (bool) {
        if (charities[charityId].deadline < block.timestamp) {
            return false;
        }

        return
            charities[charityId].fundingGoal >
            charities[charityId].fundingRaised;
    }
}
