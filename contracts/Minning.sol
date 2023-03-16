// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./RewardToken.sol";
import "./LPToken.sol";

struct UserInfo {
    uint256 depositAmount;
}

struct PoolInfo {
    address lpToken;
    uint256 weight;
    uint256 totalReward;
}

/**
 * @title a minning token accept lp token to mint reward token
 * @author jianwei.fang
 */
contract Minning {

    address public owner;

    address public rewardToken;

    PoolInfo[] public poolList;
    uint256 public poolTotalWeight;

    // user = userInfo[address][poolindex]
    mapping(address => mapping(uint256 => UserInfo)) public userInfo;

    uint256 public startRewardBlock;
    uint256 public lastRewardBlock;
    uint256 public tokenMintEachBlock;

    constructor(uint256 _startRewardBlock, uint256 _tokenMintEachBlock) {
        owner = msg.sender;
        // deploy reward token, this contract is the owner of reward token
        rewardToken = address(new RewardToken());
        startRewardBlock = _startRewardBlock;
        lastRewardBlock = _startRewardBlock;
        tokenMintEachBlock = _tokenMintEachBlock;
    }

    modifier onlyOwner() {
        require(owner == msg.sender, "only owner");
        _;
    }

    function getPoolLength() public view returns (uint256) {
        return poolList.length;
    }

    function getPoolInfo(uint256 _index) public view returns (PoolInfo memory) {
        return poolList[_index];
    }

    function addPool(address lpToken, uint256 weight) external onlyOwner {
        require(lpToken != address(0));
        // add pool will change the pool weight, so collect reward first
        _mintRewardToken();

        PoolInfo memory pool = PoolInfo(lpToken, weight, 0);
        poolList.push(pool);
        poolTotalWeight += pool.weight;
    }

    function deposit(uint256 _poolIndex, uint256 amount) external {
        require(amount > 0, "deposit amount error");

        PoolInfo storage pool = poolList[_poolIndex];
        UserInfo storage user = userInfo[msg.sender][_poolIndex];
        // auto claim reward

        require(
            LPToken(pool.lpToken).transferFrom(msg.sender, address(this), amount),
            "transferFrom fail"
        );
        user.depositAmount += amount;

        emit Deposit(msg.sender, _poolIndex, amount);
    }

    function _claim(uint256 _poolIndex) internal {

    }

    /**
     * this function is use for test, onlyOwner
     */
    function testMintRewardToken() external onlyOwner {
        _mintRewardToken();
    }

    function _mintRewardToken() internal {
        if (lastRewardBlock >= block.number || poolList.length == 0) {
            return;
        }
        uint256 mintAmount = (block.number - lastRewardBlock) * tokenMintEachBlock;
        lastRewardBlock = block.number;
        RewardToken(rewardToken).mint(address(this), mintAmount);
        for (uint256 i = 0; i < poolList.length; i++) {
            poolList[i].totalReward += mintAmount * poolList[i].weight / poolTotalWeight;
        }
    }

    event Deposit(address indexed _user, uint256 indexed _poolIndex, uint256 amount);

    event Withdraw(address indexed _user, uint256 indexed _poolIndex, uint256 amount);

}