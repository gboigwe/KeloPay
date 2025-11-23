// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Script} from "forge-std/Script.sol";
import {KeloPay} from "../contracts/KeloPay.sol";
import {KeloPayWithdrawal} from "../contracts/KeloPayWithdrawal.sol";
import {KeloPayRouter} from "../contracts/KeloPayRouter.sol";
import {KeloPayConversion} from "../contracts/KeloPayConversion.sol";

contract DeployKeloPay is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy KeloPay main contract
        // Treasury address = deployer, platform fee = 1% (100 basis points)
        KeloPay keloPay = new KeloPay(deployer, 100);

        // Deploy KeloPayWithdrawal contract
        KeloPayWithdrawal withdrawal = new KeloPayWithdrawal(deployer);

        // Deploy KeloPayRouter contract
        KeloPayRouter router = new KeloPayRouter(deployer);

        // Deploy KeloPayConversion contract
        KeloPayConversion conversion = new KeloPayConversion(deployer);

        vm.stopBroadcast();

        // Log deployed addresses
        console.log("KeloPay deployed to:", address(keloPay));
        console.log("KeloPayWithdrawal deployed to:", address(withdrawal));
        console.log("KeloPayRouter deployed to:", address(router));
        console.log("KeloPayConversion deployed to:", address(conversion));
    }
}
