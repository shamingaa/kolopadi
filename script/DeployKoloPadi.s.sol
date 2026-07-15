// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {KoloPadi} from "../src/KoloPadi.sol";

/// @notice Deployment script. Run with:
///   forge script script/DeployKoloPadi.s.sol:DeployKoloPadi --rpc-url monad_testnet --broadcast
/// Foundry auto-loads `.env` from the project root, so PRIVATE_KEY just needs to be set there.
contract DeployKoloPadi is Script {
    function run() external returns (KoloPadi kolo) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);
        kolo = new KoloPadi();
        vm.stopBroadcast();

        console.log("KoloPadi deployed at:", address(kolo));
    }
}
