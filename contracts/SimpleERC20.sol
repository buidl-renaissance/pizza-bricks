// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
}

contract SimpleERC20 {
    string public name;
    string public symbol;
    uint8 public decimals = 18;
    uint256 public totalSupply;

    // ──── Role-based access ────

    address public owner;
    address public operator;
    bool public paused;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    // Dividend tracking per reward token
    mapping(address => uint256) public dividendPerShare;
    mapping(address => mapping(address => uint256)) private creditedPerShare;
    mapping(address => mapping(address => uint256)) private pendingDividends;

    address[] public rewardTokens;
    mapping(address => bool) private rewardTokenAdded;

    address[] public holders;
    mapping(address => bool) private isHolder;

    // Blacklist — operator or owner can block addresses
    mapping(address => bool) public blacklisted;

    uint256 private constant PRECISION = 1e18;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event DividendDistributed(address indexed rewardToken, uint256 amount, address indexed distributor);
    event DividendClaimed(address indexed holder, address indexed rewardToken, uint256 amount);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event OperatorUpdated(address indexed previousOperator, address indexed newOperator);
    event Paused(address indexed by);
    event Unpaused(address indexed by);
    event Blacklisted(address indexed account, address indexed by);
    event Unblacklisted(address indexed account, address indexed by);
    event TokensMinted(address indexed to, uint256 amount, address indexed by);
    event TokensBurned(address indexed from, uint256 amount, address indexed by);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyOwnerOrOperator() {
        require(msg.sender == owner || msg.sender == operator, "Not owner or operator");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "Token is paused");
        _;
    }

    modifier notBlacklisted(address account) {
        require(!blacklisted[account], "Address is blacklisted");
        _;
    }

    constructor(string memory _name, string memory _symbol) {
        name = _name;
        symbol = _symbol;
        owner = msg.sender;
        operator = msg.sender;
        uint256 supply = 10_000 * 10 ** 18;
        totalSupply = supply;
        balanceOf[msg.sender] = supply;
        _addHolder(msg.sender);
        emit Transfer(address(0), msg.sender, supply);
    }

    // ──── ERC-20 core ────

    function transfer(address to, uint256 amount)
        public
        whenNotPaused
        notBlacklisted(msg.sender)
        notBlacklisted(to)
        returns (bool)
    {
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        _updateDividends(msg.sender);
        _updateDividends(to);
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        _addHolder(to);
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) public whenNotPaused returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount)
        public
        whenNotPaused
        notBlacklisted(from)
        notBlacklisted(to)
        returns (bool)
    {
        require(balanceOf[from] >= amount, "Insufficient balance");
        require(allowance[from][msg.sender] >= amount, "Insufficient allowance");
        _updateDividends(from);
        _updateDividends(to);
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        _addHolder(to);
        emit Transfer(from, to, amount);
        return true;
    }

    // ──── Role management (owner only) ────

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function setOperator(address newOperator) external onlyOwner {
        require(newOperator != address(0), "Zero address");
        emit OperatorUpdated(operator, newOperator);
        operator = newOperator;
    }

    // ──── Admin controls (owner or operator) ────

    function pause() external onlyOwnerOrOperator {
        paused = true;
        emit Paused(msg.sender);
    }

    function unpause() external onlyOwnerOrOperator {
        paused = false;
        emit Unpaused(msg.sender);
    }

    function addToBlacklist(address account) external onlyOwnerOrOperator {
        require(account != owner, "Cannot blacklist owner");
        blacklisted[account] = true;
        emit Blacklisted(account, msg.sender);
    }

    function removeFromBlacklist(address account) external onlyOwnerOrOperator {
        blacklisted[account] = false;
        emit Unblacklisted(account, msg.sender);
    }

    function mint(address to, uint256 amount) external onlyOwnerOrOperator {
        require(to != address(0), "Zero address");
        _updateDividends(to);
        totalSupply += amount;
        balanceOf[to] += amount;
        _addHolder(to);
        emit Transfer(address(0), to, amount);
        emit TokensMinted(to, amount, msg.sender);
    }

    function burn(address from, uint256 amount) external onlyOwnerOrOperator {
        require(balanceOf[from] >= amount, "Insufficient balance");
        _updateDividends(from);
        balanceOf[from] -= amount;
        totalSupply -= amount;
        emit Transfer(from, address(0), amount);
        emit TokensBurned(from, amount, msg.sender);
    }

    // ──── Dividend distribution (owner or operator) ────

    /// @notice Distribute `amount` of an ERC-20 reward token pro-rata to all holders.
    ///         Caller must have approved this contract to spend `amount` of `rewardToken`.
    function distributeDividend(address rewardToken, uint256 amount) external onlyOwnerOrOperator {
        require(amount > 0, "Zero amount");
        require(totalSupply > 0, "No holders");

        IERC20(rewardToken).transferFrom(msg.sender, address(this), amount);

        dividendPerShare[rewardToken] += (amount * PRECISION) / totalSupply;

        if (!rewardTokenAdded[rewardToken]) {
            rewardTokenAdded[rewardToken] = true;
            rewardTokens.push(rewardToken);
        }

        emit DividendDistributed(rewardToken, amount, msg.sender);
    }

    /// @notice Claim all pending dividends for a specific reward token.
    function claimDividend(address rewardToken) external whenNotPaused notBlacklisted(msg.sender) {
        _updateDividends(msg.sender);
        uint256 owed = pendingDividends[msg.sender][rewardToken];
        require(owed > 0, "Nothing to claim");
        pendingDividends[msg.sender][rewardToken] = 0;
        IERC20(rewardToken).transfer(msg.sender, owed);
        emit DividendClaimed(msg.sender, rewardToken, owed);
    }

    /// @notice Claim dividends for all reward tokens at once.
    function claimAllDividends() external whenNotPaused notBlacklisted(msg.sender) {
        _updateDividends(msg.sender);
        for (uint256 i = 0; i < rewardTokens.length; i++) {
            address rt = rewardTokens[i];
            uint256 owed = pendingDividends[msg.sender][rt];
            if (owed > 0) {
                pendingDividends[msg.sender][rt] = 0;
                IERC20(rt).transfer(msg.sender, owed);
                emit DividendClaimed(msg.sender, rt, owed);
            }
        }
    }

    /// @notice View unclaimed dividends for a holder for a specific reward token.
    function unclaimedDividend(address holder, address rewardToken) external view returns (uint256) {
        uint256 accumulated = (balanceOf[holder] * (dividendPerShare[rewardToken] - creditedPerShare[holder][rewardToken])) / PRECISION;
        return pendingDividends[holder][rewardToken] + accumulated;
    }

    function rewardTokenCount() external view returns (uint256) {
        return rewardTokens.length;
    }

    function holderCount() external view returns (uint256) {
        return holders.length;
    }

    // ──── Internal helpers ────

    function _updateDividends(address account) private {
        for (uint256 i = 0; i < rewardTokens.length; i++) {
            address rt = rewardTokens[i];
            uint256 owed = (balanceOf[account] * (dividendPerShare[rt] - creditedPerShare[account][rt])) / PRECISION;
            pendingDividends[account][rt] += owed;
            creditedPerShare[account][rt] = dividendPerShare[rt];
        }
    }

    function _addHolder(address account) private {
        if (!isHolder[account] && account != address(0)) {
            isHolder[account] = true;
            holders.push(account);
        }
    }
}
