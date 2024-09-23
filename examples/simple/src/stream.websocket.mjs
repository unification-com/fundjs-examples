import {WebSocket} from 'ws'

const RPC_WS = "ws://localhost:26657/websocket"

const ws = new WebSocket(RPC_WS)

const start = Math.floor(Date.now() / 1000)

console.log(`Subscribe on ${RPC_WS}`)

function getAttr(attributes, which) {
    const a = attributes.find((attr) => attr.key === which)
    return a.value
}

function parseStreamDeposit(attributes) {
    let msg = ''
    const sender = getAttr(attributes, "sender")
    const receiver = getAttr(attributes, "receiver")
    const amount = getAttr(attributes, "amount_deposited")

    msg = `Top Up deposit: ${sender} -> ${receiver}: ${amount}`

    return msg
}

function parseCreateStream(attributes) {
    let msg = ''
    const sender = getAttr(attributes, "sender")
    const receiver = getAttr(attributes, "receiver")
    const flowRate = getAttr(attributes, "flow_rate")

    msg = `Create Stream: ${sender} -> ${receiver}: ${flowRate} nund/sec`

    return msg
}

function parseClaimStream(attributes) {
    let msg = ''
    const sender = getAttr(attributes, "sender")
    const receiver = getAttr(attributes, "receiver")
    const amount = getAttr(attributes, "claim_total")

    msg = `Claim Stream: ${sender} -> ${receiver}: ${amount}`

    return msg
}

function parseUpdateFlowRate(attributes) {
    let msg = ''
    const sender = getAttr(attributes, "sender")
    const receiver = getAttr(attributes, "receiver")
    const oldFlowRate = getAttr(attributes, "old_flow_rate")
    const newFlowRate = getAttr(attributes, "new_flow_rate")

    msg = `Update Flow Rate: ${sender} -> ${receiver} from ${oldFlowRate} to ${newFlowRate} nund/sec`

    return msg
}

function parseCancelStream(attributes) {
    let msg = ''
    const sender = getAttr(attributes, "sender")
    const receiver = getAttr(attributes, "receiver")

    msg = `Stream Cancelled: ${sender} -> ${receiver}`

    return msg
}

function parseEvent(e) {
    let message = ''
    switch(e.type) {
        case "stream_deposit":
            return parseStreamDeposit(e.attributes)
        case "create_stream":
            return parseCreateStream(e.attributes)
        case "claim_stream":
            return parseClaimStream(e.attributes)
        case "update_flow_rate":
            return parseUpdateFlowRate(e.attributes)
        case "cancel_stream":
            return parseCancelStream(e.attributes)
    }
    return message
}

ws.on("open", function open() {
    ws.send(JSON.stringify({ "jsonrpc": "2.0", "method": "subscribe", "params":
            ["message.module='stream'"], "id": start }))
})

ws.on("message", function incoming(data) {
    const res = JSON.parse(data.toString())
    const blockHeight = res.result.data?.value.TxResult.height
    let txHash

    if(res.result?.events) {
        txHash = res.result?.events["tx.hash"][0]
    }

    for(let i = 0; i < res.result.data?.value.TxResult.result.events.length; i++) {
        const e = res.result.data?.value.TxResult.result.events[i]
        const msg = parseEvent(e)
        if(msg !== '') {
            console.log(`${blockHeight}: ${msg} in Tx ${txHash}`)
        }
    }
});

ws.onerror = error => {
    console.log(`WebSocket error: ${JSON.stringify(error, null, 2)}`)
}
