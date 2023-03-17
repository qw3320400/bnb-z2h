// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./RewardToken.sol";
import "./LPToken.sol";

struct UserInfo {
    uint256 lpTokenAmount;
    uint256 userRewardDebt;
}

struct PoolInfo {
    address lpToken;
    uint256 weight;
    uint256 rewardPerLPToken;
    uint256 lpTokenAmount;
}

/**
 * @title a minning token accept lp token to mint reward token
 * @author jianwei.fang
 */
contract Minning {

    // if lp token amount is bigger than reward token, rewardPerLPToken will be 0
    uint256 constant public DECIMAL = 1e10;

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

        PoolInfo memory pool = PoolInfo(lpToken, weight, 0, 0);
        poolList.push(pool);
        poolTotalWeight += pool.weight;
    }

    function deposit(uint256 _poolIndex, uint256 _amount) external {
        // auto mint reward token
        _mintRewardToken();
        // auto claim reward
        _claim(_poolIndex);
        if (_amount == 0) {
            return;
        }

        PoolInfo storage pool = poolList[_poolIndex];
        UserInfo storage user = userInfo[msg.sender][_poolIndex];
        require(
            LPToken(pool.lpToken).transferFrom(msg.sender, address(this), _amount),
            "transferFrom fail"
        );
        // first time user enter pool, set userPoolDebt
        if (user.lpTokenAmount == 0) {
            user.userRewardDebt = pool.rewardPerLPToken;
        }
        user.lpTokenAmount += _amount;
        pool.lpTokenAmount += _amount;

        emit Deposit(msg.sender, _poolIndex, _amount);
    }

    function withdraw(uint256 _poolIndex, uint256 _amount) external {
        // auto mint reward token
        _mintRewardToken();
        // auto claim reward
        _claim(_poolIndex);
        if (_amount == 0) {
            return;
        }

        PoolInfo storage pool = poolList[_poolIndex];
        UserInfo storage user = userInfo[msg.sender][_poolIndex];
        // if user do not have enough balance, will underflow here
        user.lpTokenAmount -= _amount;
        pool.lpTokenAmount -= _amount;
        require(
            LPToken(pool.lpToken).transferFrom(address(this), msg.sender, _amount),
            "transferFrom fail"
        );

        emit Withdraw(msg.sender, _poolIndex, _amount);
    }

    function claim(uint256 _poolIndex) external {
        // auto mint reward token
        _mintRewardToken();
        // auto claim reward
        _claim(_poolIndex);
    }

    function claimable(uint256 _poolIndex) public view returns (uint256) {
        PoolInfo storage pool = poolList[_poolIndex];
        UserInfo storage user = userInfo[msg.sender][_poolIndex];
        return (pool.rewardPerLPToken - user.userRewardDebt) * user.lpTokenAmount / DECIMAL;
    }

    function _claim(uint256 _poolIndex) internal {
        uint256 rewardAmount = claimable(_poolIndex);
        if (rewardAmount == 0) {
            return;
        }
        userInfo[msg.sender][_poolIndex].userRewardDebt = poolList[_poolIndex].rewardPerLPToken;
        require(
            RewardToken(rewardToken).transferFrom(address(this), msg.sender, rewardAmount),
            "transferFrom fail"
        );
    }

    /**
     * this function is use for test, onlyOwner
     */
    function testMintRewardToken() external onlyOwner {
        _mintRewardToken();
    }

    function _mintRewardToken() internal {
        if (lastRewardBlock >= block.number || poolList.length == 0 || poolTotalWeight == 0) {
            return;
        }
        uint256 mintAmount = (block.number - lastRewardBlock) * tokenMintEachBlock;
        lastRewardBlock = block.number;
        RewardToken(rewardToken).mint(address(this), mintAmount);
        for (uint256 i = 0; i < poolList.length; i++) {
            if (poolList[i].lpTokenAmount == 0) {
                continue;
            }
            // if lpTokenAmount is too big, this could be 0
            poolList[i].rewardPerLPToken += mintAmount * poolList[i].weight * DECIMAL / poolTotalWeight / poolList[i].lpTokenAmount;
        }
    }

    event Deposit(address indexed _user, uint256 indexed _poolIndex, uint256 amount);

    event Withdraw(address indexed _user, uint256 indexed _poolIndex, uint256 amount);

}