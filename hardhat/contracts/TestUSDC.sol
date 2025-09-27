// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title TestUSDC - A testnet ERC20 token similar to USDC
 * @dev ERC20 token with minting, burning, and pausable functionality
 */

// OpenZeppelin imports for Remix
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract TestUSDC is ERC20, ERC20Burnable, ERC20Pausable, Ownable, AccessControl {
    // Role for minters
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    
    // Maximum supply (optional - remove if you want unlimited)
    uint256 public constant MAX_SUPPLY = 1000000000 * 10**6; // 1B tokens with 6 decimals
    
    // Events
    event Mint(address indexed to, uint256 amount);
    event Burn(address indexed from, uint256 amount);
    
    constructor(
        string memory name,
        string memory symbol,
        address initialOwner
    ) ERC20(name, symbol) Ownable(initialOwner) {
        // Grant the contract deployer the default admin role
        _grantRole(DEFAULT_ADMIN_ROLE, initialOwner);
        _grantRole(MINTER_ROLE, initialOwner);
        _grantRole(PAUSER_ROLE, initialOwner);
        
        // Optional: Mint initial supply to owner
        // _mint(initialOwner, 1000000 * 10**decimals()); // 1M initial tokens
    }
    
    /**
     * @dev Returns the number of decimals used to get its user representation.
     * USDC uses 6 decimals
     */
    function decimals() public view virtual override returns (uint8) {
        return 6;
    }
    
    /**
     * @dev Mint new tokens to specified address
     * Can only be called by addresses with MINTER_ROLE
     */
    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        require(to != address(0), "TestUSDC: mint to the zero address");
        require(totalSupply() + amount <= MAX_SUPPLY, "TestUSDC: max supply exceeded");
        
        _mint(to, amount);
        emit Mint(to, amount);
    }
    
    /**
     * @dev Batch mint to multiple addresses
     */
    function batchMint(address[] calldata recipients, uint256[] calldata amounts) 
        external 
        onlyRole(MINTER_ROLE) 
    {
        require(recipients.length == amounts.length, "TestUSDC: arrays length mismatch");
        
        for (uint256 i = 0; i < recipients.length; i++) {
            mint(recipients[i], amounts[i]);
        }
    }
    
    /**
     * @dev Pause all token transfers
     * Can only be called by addresses with PAUSER_ROLE
     */
    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }
    
    /**
     * @dev Unpause all token transfers
     * Can only be called by addresses with PAUSER_ROLE
     */
    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }
    
    /**
     * @dev Burn tokens from caller's account
     */
    function burn(uint256 amount) public override {
        _burn(_msgSender(), amount);
        emit Burn(_msgSender(), amount);
    }
    
    /**
     * @dev Burn tokens from specified account (requires allowance)
     */
    function burnFrom(address account, uint256 amount) public override {
        _spendAllowance(account, _msgSender(), amount);
        _burn(account, amount);
        emit Burn(account, amount);
    }
    
    /**
     * @dev Add a new minter
     * Can only be called by admin
     */
    function addMinter(address account) public onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(MINTER_ROLE, account);
    }
    
    /**
     * @dev Remove a minter
     * Can only be called by admin
     */
    function removeMinter(address account) public onlyRole(DEFAULT_ADMIN_ROLE) {
        revokeRole(MINTER_ROLE, account);
    }
    
    /**
     * @dev Add a new pauser
     * Can only be called by admin
     */
    function addPauser(address account) public onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(PAUSER_ROLE, account);
    }
    
    /**
     * @dev Remove a pauser
     * Can only be called by admin
     */
    function removePauser(address account) public onlyRole(DEFAULT_ADMIN_ROLE) {
        revokeRole(PAUSER_ROLE, account);
    }
    
    /**
     * @dev Emergency function to recover accidentally sent tokens
     * Can only be called by owner
     */
    function recoverERC20(address tokenAddress, uint256 tokenAmount) 
        external 
        onlyOwner 
    {
        require(tokenAddress != address(this), "TestUSDC: cannot recover own token");
        IERC20(tokenAddress).transfer(owner(), tokenAmount);
    }
    
    // Required overrides for multiple inheritance
    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Pausable)
    {
        super._update(from, to, value);
    }
}

