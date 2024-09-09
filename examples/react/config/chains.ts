import { assets as baseAssets, chains as baseChains } from "chain-registry";
import { Chain, AssetList } from '@chain-registry/types';
import {defaultChainName} from "@/config/defaults";

const fundAssets: AssetList = baseAssets.find(
    (chain) => chain.chain_name === defaultChainName
) as AssetList;

const unificationTestnetAssets = {...fundAssets}
unificationTestnetAssets.chain_name = "unificationtestnet"

const unificationDevnetAssets = {...fundAssets}
unificationDevnetAssets.chain_name = "unificationdevnet"

const fundMainNet: Chain = baseChains.find(
    (chain) => chain.chain_name === defaultChainName
) as Chain

const unificationTestnet: Chain = {
    bech32_prefix: "und",
    chain_id: "FUND-TestNet-2",
    chain_name: "unificationtestnet",
    network_type: "cosmos",
    pretty_name: "Unification TestNet",
    slip44: 5555,
    status: "live",
    fees: {
        fee_tokens: [
            {
                denom: "nund",
                fixed_min_gas_price: 25,
                low_gas_price: 100,
                average_gas_price: 200,
                high_gas_price: 300
            }
        ]
    },
    staking: {
        staking_tokens: [
            {
                denom: "nund"
            }
        ],
        lock_duration: {
            time: "1814400s"
        }
    },
    apis: {
        rpc: [
            {
                address: "https://rpc-testnet.unification.io:443",
                provider: "Unification"
            }
        ],
        rest: [
            {
                address: "https://rest-testnet.unification.io",
                provider: "Unification"
            }
        ],
        grpc: [
            {
                address: "grpc-testnet.unification.io:443",
                provider: "Unification"
            }
        ]
    },
    explorers: [
        {
            kind: "ping.pub",
            url: "https://explorer-testnet.unification.io/u",
            tx_page: "https://explorer-testnet.unification.io/u/tx/${txHash}",
            account_page: "https://explorer-testnet.unification.io/u/account/${accountAddress}"
        }
    ],
}

const unificationDevnet: Chain = {
    bech32_prefix: "und",
    chain_id: "FUND-DevNet",
    chain_name: "unificationdevnet",
    network_type: "cosmos",
    pretty_name: "Unification DevNet",
    slip44: 5555,
    status: "live",
    fees: {
        fee_tokens: [
            {
                denom: "nund",
                fixed_min_gas_price: 25,
                low_gas_price: 100,
                average_gas_price: 200,
                high_gas_price: 300
            }
        ]
    },
    staking: {
        staking_tokens: [
            {
                denom: "nund"
            }
        ],
        lock_duration: {
            time: "1814400s"
        }
    },
    apis: {
        rpc: [
            {
                address: "http://localhost:26657",
                provider: "Unification"
            }
        ],
        rest: [
            {
                address: "http://localhost:1317",
                provider: "Unification"
            }
        ]
    },
}



export const chains: Chain[] = [fundMainNet, unificationTestnet, unificationDevnet]
export const assets: AssetList[] = [fundAssets, unificationTestnetAssets, unificationDevnetAssets]
