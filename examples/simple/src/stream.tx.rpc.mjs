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

import { MNEMONIC } from './defaults.mjs'

const RPC_ENDPOINT = "http://localhost:26657"

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

console.log("- Payment Stream Tx examples with custom combined signing client")

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
    console.log("- Create stream for 100 FUND/month to und17tc3wwr8ksz5tzgl2t4wmpdmaxx0pn7vvz8j3h")
    const {createStream} = mainchain.stream.v1.MessageComposer.withTypeUrl;

    const msg = createStream({
        deposit: {
            denom: 'nund',
            amount: '100000000000'
        },
        flowRate: '38051',
        receiver: 'und17tc3wwr8ksz5tzgl2t4wmpdmaxx0pn7vvz8j3h',
        sender: 'und1sc4wry4kwypu4ddj9nme70dw3ka6wyhv7sc3vx'
    })

    const fee = {
        amount: [
            {
                denom: 'nund',
                amount: '50000000'
            }
        ],
        gas: '2000000'
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

    if(tx.txResponse.code !== 0) {
        console.log(`  - Reason : ${tx.txResponse.rawLog}`)
    }

    return clients
}).then(async clients => {
    console.log("- Get streams for und1sc4wry4kwypu4ddj9nme70dw3ka6wyhv7sc3vx")
    const request = {
        receiverAddr: "und17tc3wwr8ksz5tzgl2t4wmpdmaxx0pn7vvz8j3h",
        senderAddr: "und1sc4wry4kwypu4ddj9nme70dw3ka6wyhv7sc3vx",
    }
    const streamRes = await clients.queryClient.mainchain.stream.v1.streamByReceiverSender(request);

    console.log(`  - Stream:`)
    console.log(`    - sender: ${streamRes.stream.sender}`)
    console.log(`    - receiver: ${streamRes.stream.receiver}`)
    console.log(`    - deposit: ${streamRes.stream.stream.deposit.amount.toString()}${streamRes.stream.stream.deposit.denom}`)
    console.log(`    - flowRate: ${streamRes.stream.stream.flowRate} nund/sec`)
    console.log(`    - lastOutflowTime: ${streamRes.stream.stream.lastOutflowTime}`)
    console.log(`    - depositZeroTime: ${streamRes.stream.stream.depositZeroTime}`)
    return clients
})
    .catch(error => {
        console.error(error);
    })
