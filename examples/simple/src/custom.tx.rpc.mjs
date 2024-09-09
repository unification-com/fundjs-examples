import {mainchain, cosmos} from '@unification-com/fundjs';
import { getOfflineSignerAminoAccNum} from './signer.mjs';
import { Registry } from "@cosmjs/proto-signing";
import { AminoTypes, SigningStargateClient } from "@cosmjs/stargate";
import {
    cosmosAminoConverters,
    cosmosProtoRegistry,
    ibcProtoRegistry,
    ibcAminoConverters,
    mainchainAminoConverters,
    mainchainProtoRegistry
} from '@unification-com/fundjs';

const RPC_ENDPOINT = "http://localhost:26657"

// DevNet mnemonic
const MNEMONIC = "wish glad forget ski rhythm mouse omit gun fatal whale switch gift nephew cactus noise athlete spin damp never jacket absorb client top grass"
const {createRPCQueryClient} = mainchain.ClientFactory;

const protoRegistry = [
    ...cosmosProtoRegistry,
    ...ibcProtoRegistry,
    ...mainchainProtoRegistry
];

const aminoConverters = {
    ...cosmosAminoConverters,
    ...ibcAminoConverters,
    ...mainchainAminoConverters
};

const registry = new Registry(protoRegistry);
const aminoTypes = new AminoTypes(aminoConverters);

// An advanced tx with combined signer using RPC client

console.log("- Advanced Tx examples with custom combined signing client")

// first create the signer, using custom/extended getOfflineSignerAmino
// to allow for account num to be passed to the hdPath method
getOfflineSignerAminoAccNum({
    mnemonic: MNEMONIC,
    chain: {
        bech32_prefix: "und",
        slip44: 5555,
    },
    account: 3,
}).then(async signer => {
    // console.log(signer)

    // create client with signer containing all codecs for cosmos, mainchain and ibc
    const clientWithSigner = await SigningStargateClient.connectWithSigner(RPC_ENDPOINT, signer, {
        registry,
        aminoTypes
    })

    // create query client
    const queryClient = await createRPCQueryClient({rpcEndpoint: RPC_ENDPOINT})

    return {clientWithSigner, queryClient}

}).then(async clients => {
    console.log("- Get balance for und1sc4wry4kwypu4ddj9nme70dw3ka6wyhv7sc3vx")
    const request = {
        address: "und1sc4wry4kwypu4ddj9nme70dw3ka6wyhv7sc3vx",
        denom: "nund"
    }
    const balance = await clients.queryClient.cosmos.bank.v1beta1.balance(request);

    console.log(`  - Balance before: ${balance.balance.amount} ${balance.balance.denom}`)
    return clients
}).then(async clients => {
    // simple send tx
    console.log("- Send 10 FUND to und17tc3wwr8ksz5tzgl2t4wmpdmaxx0pn7vvz8j3h")
    const {send} = cosmos.bank.v1beta1.MessageComposer.withTypeUrl;

    const msg = send({
        amount: [
            {
                denom: 'nund',
                amount: '10000000000'
            }
        ],
        toAddress: "und17tc3wwr8ksz5tzgl2t4wmpdmaxx0pn7vvz8j3h",
        fromAddress: "und1sc4wry4kwypu4ddj9nme70dw3ka6wyhv7sc3vx"
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

    const response = await clients.clientWithSigner.signAndBroadcast("und1sc4wry4kwypu4ddj9nme70dw3ka6wyhv7sc3vx", [msg], fee);
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
    console.log("- Get balance for und1sc4wry4kwypu4ddj9nme70dw3ka6wyhv7sc3vx")
    const request = {
        address: "und1sc4wry4kwypu4ddj9nme70dw3ka6wyhv7sc3vx",
        denom: "nund"
    }
    const balance = await clients.queryClient.cosmos.bank.v1beta1.balance(request);

    console.log(`  - Balance after: ${balance.balance.amount} ${balance.balance.denom}`)
    return clients
})
    .catch(error => {
        console.error(error);
    })
