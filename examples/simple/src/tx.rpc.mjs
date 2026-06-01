import { mainchain, cosmos } from '@unification-com/fundjs';
import { SigningStargateClient } from "@cosmjs/stargate";
import { getOfflineSignerAmino } from './signer.mjs';
import { registry, aminoTypes } from './registry.mjs';

import { MNEMONIC } from './defaults.mjs'

const RPC_ENDPOINT = "http://localhost:26657"

const {createRPCQueryClient} = mainchain.ClientFactory;

// A simple tx with signer using RPC client

console.log("- Simple Tx examples with Cosmos signing client")

// first create the signer
getOfflineSignerAmino({
    mnemonic: MNEMONIC,
    chain: {
        bech32_prefix: "und",
        slip44: 5555,
    }
}).then(async signer => {
    // create client with signer
    // fundjs@^0.2.0 (telescope 2.x) no longer ships the bundled
    // `getSigningCosmosClient` / `getSigningMainchainClient` helpers.
    // Compose a `SigningStargateClient` directly with the shared
    // registry + aminoTypes from `./registry.mjs` instead — that
    // single client supports the full Cosmos + IBC + Mainchain
    // Msg surface, so the old single-vs-combined-client split is gone.
    const clientWithSigner = await SigningStargateClient.connectWithSigner(
        RPC_ENDPOINT,
        signer,
        { registry, aminoTypes }
    )

    // create query client
    const queryClient = await createRPCQueryClient({rpcEndpoint: RPC_ENDPOINT})

    return {clientWithSigner, queryClient}

}).then(async clients => {
    console.log("- Get balance for und1eq239sgefyzm4crl85nfyvt7kw83vrna3f0eed")
    const request = {
        address: "und1eq239sgefyzm4crl85nfyvt7kw83vrna3f0eed",
        denom: "nund"
    }
    const balance = await clients.queryClient.cosmos.bank.v1beta1.balance(request);

    console.log(`  - Balance before: ${balance.balance.amount} ${balance.balance.denom}`)
    console.log("- Get balance for und1uqzk628zwztwa438dk648whfvxscsvf2cce3nw")
    const request1 = {
        address: "und1uqzk628zwztwa438dk648whfvxscsvf2cce3nw",
        denom: "nund"
    }
    const balance1 = await clients.queryClient.cosmos.bank.v1beta1.balance(request1);

    console.log(`  - Balance before: ${balance1.balance.amount} ${balance1.balance.denom}`)
    return clients
}).then(async clients => {
    // simple send tx
    console.log("- Send 10 FUND to und1uqzk628zwztwa438dk648whfvxscsvf2cce3nw")
    const {send} = cosmos.bank.v1beta1.MessageComposer.withTypeUrl;

    const msg = send({
        amount: [
            {
                denom: 'nund',
                amount: '10000000000'
            }
        ],
        toAddress: "und1uqzk628zwztwa438dk648whfvxscsvf2cce3nw",
        fromAddress: "und1eq239sgefyzm4crl85nfyvt7kw83vrna3f0eed"
    });


    const fee = {
        amount: [
            {
                denom: 'nund',
                amount: '25000000'
            }
        ],
        gas: '200000'
    };

    const response = await clients.clientWithSigner.signAndBroadcast("und1eq239sgefyzm4crl85nfyvt7kw83vrna3f0eed", [msg], fee);
    const txHash = response.transactionHash
    console.log(`  - Tx: ${txHash}`)

    return {clients, txHash}

}).then(async ret => {
    const clients = ret.clients
    const hash = ret.txHash
    console.log(` - Get Tx ${hash}`)

    const tx = await clients.queryClient.cosmos.tx.v1beta1.getTx({hash})

    console.log(`  - Success: ${tx.txResponse.code === 0 ? "true" : "false"}`)

    return clients
}).then(async clients => {
    console.log("- Get balance for und1eq239sgefyzm4crl85nfyvt7kw83vrna3f0eed")
    const request = {
        address: "und1eq239sgefyzm4crl85nfyvt7kw83vrna3f0eed",
        denom: "nund"
    }
    const balance = await clients.queryClient.cosmos.bank.v1beta1.balance(request);

    console.log(`  - Balance after: ${balance.balance.amount} ${balance.balance.denom}`)
    console.log("- Get balance for und1uqzk628zwztwa438dk648whfvxscsvf2cce3nw")
    const request1 = {
        address: "und1uqzk628zwztwa438dk648whfvxscsvf2cce3nw",
        denom: "nund"
    }
    const balance1 = await clients.queryClient.cosmos.bank.v1beta1.balance(request1);

    console.log(`  - Balance after: ${balance1.balance.amount} ${balance1.balance.denom}`)
    return clients
})
    .catch(error => {
        console.error(error);
    })
