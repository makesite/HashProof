// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract HashProof {
    struct Proof {
        address prover;
        uint256 timestamp;
        uint256 blockNumber;
        string label;
    }

    mapping(bytes32 => Proof) public proofs;
    bytes32[] public allHashes;

    event Proved(bytes32 indexed hash, address indexed prover, string label, uint256 timestamp);

    function prove(bytes32 hash, string calldata label) external {
        require(proofs[hash].timestamp == 0, "Already proved");
        proofs[hash] = Proof(msg.sender, block.timestamp, block.number, label);
        allHashes.push(hash);
        emit Proved(hash, msg.sender, label, block.timestamp);
    }

    function verify(bytes32 hash) external view returns (bool exists, address prover, uint256 timestamp, uint256 blockNumber, string memory label) {
        Proof storage p = proofs[hash];
        return (p.timestamp > 0, p.prover, p.timestamp, p.blockNumber, p.label);
    }

    function total() external view returns (uint256) { return allHashes.length; }
}