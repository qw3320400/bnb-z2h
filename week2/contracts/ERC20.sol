// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title my simple ERC20 contract
 * @author jianwei.fang
 */
contract ERC20 {

    string public name;

    string public symbol;

    uint8 public decimals;

    uint256 public totalSupply;

    uint256 public maxSupply;

    mapping(address => uint256) public balanceOf;

    // remaining = allowance[_owner][_spender]
    mapping(address => mapping(address => uint256)) public allowance;

    constructor(string memory _name, string memory _symbol, uint8 _decimals, uint256 _maxSupply) {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        maxSupply = _maxSupply;
    }

    function transfer(address _to, uint256 _value) public virtual returns (bool) {
        _transfer(msg.sender, _to, _value);
        return true;
    }

    function transferFrom(address _from, address _to, uint256 _value) public virtual returns (bool) {
        // if _from is msg.sender, do not need to approve
        if (_from != msg.sender) {
            // if no enough allowance, will overflow here
            _approve(_from, msg.sender, allowance[_from][msg.sender]-_value);
        }
        _transfer(_from, _to, _value);
        return true;
    }

    function _mint(address _to, uint256 _value) internal virtual returns (bool) {
        require(_to != address(0), "address is 0");
        require(totalSupply+_value <= maxSupply, "over supply");

        balanceOf[_to] += _value;
        totalSupply += _value;
        emit Transfer(address(0), _to, _value);

        return true;
    }

    function _burn(address _from, uint256 _value) internal virtual returns (bool) {
        require(_from != address(0), "address is 0");

        // if no enough balance, it will underflow here
        balanceOf[_from] -= _value;
        totalSupply -= _value;
        emit Transfer(_from, address(0), _value);

        return true;
    }

    /**
     * _transfer is call by transfer and transferFrom, if fail, should revert the tx
     */
    function _transfer(address _from, address _to, uint256 _value) internal virtual {
        require(_from != address(0) && _to != address(0), "send from/to 0 address");
        require(_value != 0, "send value is 0");

        // if no enough balance, it will underflow here
        balanceOf[_from] -= _value;
        balanceOf[_to] += _value;

        emit Transfer(_from, _to, _value);
    }

    function approve(address _spender, uint256 _value) public virtual returns (bool) {
        _approve(msg.sender, _spender, _value);
        return true;
    }

    function increaseApproval(address _spender, uint256 _value) public virtual returns (bool) {
        _approve(msg.sender, _spender, allowance[msg.sender][_spender]+_value);
        return true;
    }

    function decreaseApproval(address _spender, uint256 _value) public virtual returns (bool) {
        _approve(msg.sender, _spender, allowance[msg.sender][_spender]-_value);
        return true;
    }

    /**
     * _isApproved check if transfer is approved
     */
    function _isApproved(address _owner, address _spender, uint256 _value) internal virtual view returns (bool) {
        return allowance[_owner][_spender] >= _value;
    }

    /**
     * _approve implementation, if fail, should revert the tx
     */
    function _approve(address _owner, address _spender, uint256 _value) internal virtual {
        require(_owner != _spender, "_owner is equal to spender");

        allowance[_owner][_spender] = _value;

        emit Approval(_owner, _spender, _value);
    }

    event Transfer(address indexed _from, address indexed _to, uint256 _value);

    event Approval(address indexed _owner, address indexed _spender, uint256 _value);

}