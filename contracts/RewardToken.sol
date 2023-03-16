// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./ERC20.sol";

/**
 * @title a testing erc20 reward token
 * @author jianwei.fang
 */
contract RewardToken is ERC20 {

    address public owner;

    constructor() ERC20("My RewardToken", "RWD", 18, 10**9 * 10**18) {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(owner == msg.sender, "only owner");
        _;
    }

    function mint(address _to, uint256 _value) external onlyOwner {
        require(_mint(_to, _value), "mint fail");
    }

}