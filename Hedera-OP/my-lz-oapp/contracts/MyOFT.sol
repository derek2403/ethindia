// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.22;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { OFT } from "@layerzerolabs/oft-evm/contracts/OFT.sol";

contract MyOFT is OFT {
    constructor(
        string memory _name,
        string memory _symbol,
        address _lzEndpoint,
        address _delegate
    ) OFT(_name, _symbol, _lzEndpoint, _delegate) Ownable(_delegate) {}

    /**
     * @dev Mint function for testing - allows the owner to mint tokens
     * @param to The address to mint tokens to
     * @param amount The amount of tokens to mint (in token decimals)
     */
    function mint(address to, uint256 amount) external virtual onlyOwner {
        _mint(to, amount);
    }
}
