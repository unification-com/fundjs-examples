import { mainchain } from '@unification-com/fundjs';

const REST_ENDPOINT = "http://localhost:1317"
const { createLCDClient } = mainchain.ClientFactory;

// A few simple queries using the REST Query Client

// first create the client
createLCDClient({ restEndpoint: REST_ENDPOINT })
    .then(async client => {
        // Query node_info
        console.log("- Get node info")
        const nodeInfo = await client.cosmos.base.tendermint.v1beta1.getNodeInfo()
        console.log(`  - Chain ID: ${nodeInfo.default_node_info.network}`)
        return client
    }).then(async (client) => {
    // Query a wallet balance
    console.log("- Get balance for und1hlmjew4k9mezd28chyyp8yzwjjkyupfep5zqlh")
    const balances = await client.cosmos.bank.v1beta1.allBalances({ address: 'und1hlmjew4k9mezd28chyyp8yzwjjkyupfep5zqlh' });
    console.log(`  - Balance: ${balances.balances[0].amount} ${balances.balances[0].denom}`)
    return client
}).then(async (client) => {
    // Calculate 100 FUND/Month flow rate for Payment Streams
    console.log("- calculate flow rate for 100 FUND/month")
    const flowRate = await client.mainchain.stream.v1.calculateFlowRate({coin: "100000000000nund", period: 6, duration: 1})
    console.log(`  - Flow Rate: ${flowRate.flow_rate} nund/s`)
})
    .catch(error => {
        console.error(error);
    })
