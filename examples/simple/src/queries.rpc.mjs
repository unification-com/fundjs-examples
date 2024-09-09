import { mainchain, ibc } from '@unification-com/fundjs';

const RPC_ENDPOINT = "http://localhost:26657"
const { createRPCQueryClient: createMainchainRPCQueryClient } = mainchain.ClientFactory;
const { createRPCQueryClient: createIbcRPCQueryClient } = ibc.ClientFactory;

// A few simple queries using the RPC Query Client

// first create the client
createMainchainRPCQueryClient({ rpcEndpoint: RPC_ENDPOINT })
    .then(async mainchainClient => {
        // Mainchain client has all mainchain (BEACON etc.) and Cosmos SDK query endpoints
        // Also need to create an IBC client for IBC queries
        console.log("- Create IBC client")
        const ibcClient = await createIbcRPCQueryClient({ rpcEndpoint: RPC_ENDPOINT })
        return {mainchainClient, ibcClient}
    }).then(async clients => {
        // Query node_info
        console.log("- Get node info")
        const nodeInfo = await clients.mainchainClient.cosmos.base.tendermint.v1beta1.getNodeInfo()
        console.log(`  - Chain ID: ${nodeInfo.nodeInfo.network}`)
        return clients
    }).then(async clients => {
    // Query node_info
    console.log("- Get account info for und1eq239sgefyzm4crl85nfyvt7kw83vrna3f0eed")
    const account = await clients.mainchainClient.cosmos.auth.v1beta1.account({ address: 'und1eq239sgefyzm4crl85nfyvt7kw83vrna3f0eed' })

    console.log(`  - Key Type: ${account.account.pubKey.typeUrl}`)
    console.log(`  - Acc. Num: ${account.account.accountNumber}`)
    console.log(`  - Sequence: ${account.account.sequence}`)
    // console.log(account)
    return clients
}).then(async (clients) => {
        // Query a wallet balance
        console.log("- Get balance for und1eq239sgefyzm4crl85nfyvt7kw83vrna3f0eed")
        const balances = await clients.mainchainClient.cosmos.bank.v1beta1.allBalances({ address: 'und1eq239sgefyzm4crl85nfyvt7kw83vrna3f0eed' });
        console.log(`  - Balance: ${balances.balances[0].amount} ${balances.balances[0].denom}`)
        return clients
    }).then(async (clients) => {
        // Calculate 100 FUND/Month flow rate for Payment Streams
        console.log("- calculate flow rate for 100 FUND/month")
        const flowRate = await clients.mainchainClient.mainchain.stream.v1.calculateFlowRate({coin: "100000000000nund", period: 6, duration: 1})
        console.log(`  - Flow Rate: ${flowRate.flowRate} nund/s`)
    return clients
}).then(async (clients) => {
    // got some IBC info
    console.log("- Get Num IBC Channels")
    const channels = await clients.ibcClient.ibc.core.channel.v1.channels()
    console.log(`  - Num. Channels: ${channels.channels.length}`)
})
    .catch(error => {
        console.error(error);
    })
