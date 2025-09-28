// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

/**
 * @title Simple Escrow Contract
 * @dev A minimal escrow contract with only 3 essential functions
 */
contract Withdraw {
    
    // Nested mapping: merchant -> token -> balance
    // Use address(0) for ETH
    mapping(address => mapping(address => uint256)) public merchantBalances;
    
    // Track which tokens each merchant has received
    mapping(address => address[]) public merchantTokens;
    mapping(address => mapping(address => bool)) public merchantHasToken;
    
    /**
     * @dev View all balances for a merchant
     * @param _merchant Address of the merchant
     */
    function viewEscrow(address _merchant) external view returns (
        address[] memory tokens,
        uint256[] memory balances
    ) {
        address[] memory merchantTokenList = merchantTokens[_merchant];
        uint256[] memory merchantBalanceList = new uint256[](merchantTokenList.length);
        
        for (uint256 i = 0; i < merchantTokenList.length; i++) {
            merchantBalanceList[i] = merchantBalances[_merchant][merchantTokenList[i]];
        }
        
        return (merchantTokenList, merchantBalanceList);
    }
    
    /**
     * @dev Deposit one or multiple tokens into escrow for merchants
     * @param _merchants Array of merchant addresses (can be same address multiple times)
     * @param _tokens Array of token addresses (use address(0) for ETH)
     * @param _amounts Array of token amounts
     */
    function deposit(
        address[] calldata _merchants,
        address[] calldata _tokens, 
        uint256[] calldata _amounts
    ) external payable {
        require(_merchants.length == _tokens.length && _tokens.length == _amounts.length, "Arrays length mismatch");
        require(_merchants.length > 0, "Empty arrays not allowed");
        
        uint256 totalEthRequired = 0;
        
        // First pass: Calculate total ETH needed and validate inputs
        for (uint256 i = 0; i < _merchants.length; i++) {
            require(_merchants[i] != address(0), "Invalid merchant address");
            
            if (_tokens[i] == address(0)) {
                // ETH deposit
                require(_amounts[i] > 0, "ETH amount must be greater than 0");
                totalEthRequired += _amounts[i];
            } else {
                // ERC20 token deposit
                require(_amounts[i] > 0, "Token amount must be greater than 0");
            }
        }
        
        // Verify sent ETH matches required amount
        require(msg.value == totalEthRequired, "Incorrect ETH amount sent");
        
        // Second pass: Execute deposits
        for (uint256 i = 0; i < _merchants.length; i++) {
            if (_tokens[i] == address(0)) {
                // ETH deposit
                merchantBalances[_merchants[i]][address(0)] += _amounts[i];
                
                // Track that merchant has ETH (if not already tracked)
                if (!merchantHasToken[_merchants[i]][address(0)]) {
                    merchantTokens[_merchants[i]].push(address(0));
                    merchantHasToken[_merchants[i]][address(0)] = true;
                }
            } else {
                // ERC20 token deposit
                IERC20(_tokens[i]).transferFrom(msg.sender, address(this), _amounts[i]);
                
                // Add to merchant's token balance
                merchantBalances[_merchants[i]][_tokens[i]] += _amounts[i];
                
                // Track that merchant has this token (if not already tracked)
                if (!merchantHasToken[_merchants[i]][_tokens[i]]) {
                    merchantTokens[_merchants[i]].push(_tokens[i]);
                    merchantHasToken[_merchants[i]][_tokens[i]] = true;
                }
            }
        }
    }
    
    /**
     * @dev Withdraw all accumulated funds - both ETH and all tokens (called by merchant)
     */
    function withdraw() external {
        address[] memory tokens = merchantTokens[msg.sender];
        bool hasWithdrawn = false;
        
        // Withdraw all tokens including ETH
        for (uint256 i = 0; i < tokens.length; i++) {
            address token = tokens[i];
            uint256 balance = merchantBalances[msg.sender][token];
            
            if (balance > 0) {
                // Reset balance before transfer to prevent reentrancy
                merchantBalances[msg.sender][token] = 0;
                hasWithdrawn = true;
                
                if (token == address(0)) {
                    // Transfer ETH
                    payable(msg.sender).transfer(balance);
                } else {
                    // Transfer ERC20 token
                    IERC20(token).transfer(msg.sender, balance);
                }
            }
        }
        
        require(hasWithdrawn, "No funds to withdraw");
    }
}