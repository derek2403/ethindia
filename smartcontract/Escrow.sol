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
contract Escrow {
    
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
     * @dev Deposit ETH or ERC20 tokens into escrow for a merchant
     * @param _merchant Address of the merchant
     * @param _token Address of the ERC20 token (use address(0) for ETH)
     * @param _amount Amount of tokens to deposit (ignored for ETH, uses msg.value)
     */
    function deposit(address _merchant, address _token, uint256 _amount) external payable {
        require(_merchant != address(0), "Invalid merchant address");
        
        if (_token == address(0)) {
            // ETH deposit
            require(msg.value > 0, "ETH amount must be greater than 0");
            
            // Add to merchant's ETH balance
            merchantBalances[_merchant][address(0)] += msg.value;
            
            // Track that merchant has ETH (if not already tracked)
            if (!merchantHasToken[_merchant][address(0)]) {
                merchantTokens[_merchant].push(address(0));
                merchantHasToken[_merchant][address(0)] = true;
            }
        } else {
            // ERC20 token deposit
            require(_amount > 0, "Token amount must be greater than 0");
            require(msg.value == 0, "Cannot send ETH when depositing tokens");
            
            // Transfer tokens from payer to this contract
            IERC20(_token).transferFrom(msg.sender, address(this), _amount);
            
            // Add to merchant's token balance
            merchantBalances[_merchant][_token] += _amount;
            
            // Track that merchant has this token (if not already tracked)
            if (!merchantHasToken[_merchant][_token]) {
                merchantTokens[_merchant].push(_token);
                merchantHasToken[_merchant][_token] = true;
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
