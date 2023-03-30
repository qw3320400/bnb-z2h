// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MyTokenV1 is ERC20 {
    string constant tokenName = "MyTokenV1";
    string constant tokenSymbol = "MT1";

    bool public initialized;

    uint256 private _x;
    uint256 public z;

    constructor() ERC20("", "") {
    }

    /**
     * initialization
     */
    function initialize() external {
        require(!initialized, "already initialized");
        initialized = true;
        _x = 3;
    }

    /**
     * override token name
     */
    function name() public pure override returns (string memory) {
        return tokenName;
    }

    /**
     * override token symbol
     */
    function symbol() public pure override returns (string memory) {
        return tokenSymbol;
    }

    function calculateZ(uint256 y) external {
        z = _x + y;
    }
}