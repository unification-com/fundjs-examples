import { assets as baseAssets, chains as baseChains } from "chain-registry";
import { Chain, AssetList } from '@chain-registry/types';
import {defaultChainName} from "@/config/defaults";

const fundAssets: AssetList = baseAssets.find(
    (chain) => chain.chain_name === defaultChainName
) as AssetList;

const unificationTestnetAssets: AssetList = baseAssets.find(
    (chain) => chain.chain_name === "unificationtestnet"
) as AssetList;

const unificationDevnetAssets = {...fundAssets}
unificationDevnetAssets.chain_name = "unificationdevnet"

const unificationMainNet: Chain = baseChains.find(
    (chain) => chain.chain_name === defaultChainName
) as Chain

const unificationTestnet: Chain = baseChains.find(
    (chain) => chain.chain_name === "unificationtestnet"
) as Chain

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

export const chains: Chain[] = [unificationMainNet, unificationTestnet, unificationDevnet]
export const assets: AssetList[] = [fundAssets, unificationTestnetAssets, unificationDevnetAssets]
