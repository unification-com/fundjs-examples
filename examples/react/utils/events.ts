import {Coin, parseCoins} from "@cosmjs/stargate";

function bytesToSring(bytes: Uint8Array) {
    const decoder = new TextDecoder();
    return decoder.decode(bytes);
}

export function getAttr(attributes: any[], which: string): string {
    const a = attributes.find((attr) => {
        const k = (typeof attr.key === "object") ? bytesToSring(attr.key) : attr.key;
        return k === which
    });
    return (typeof a?.value === "object" ? bytesToSring(a.value) : a?.value) as string;
}

export function isSenderOrReceiver(attributes: any[], address: string): boolean {
    const sender = getAttr(attributes, "sender");
    const receiver = getAttr(attributes, "receiver");
    return sender === address || receiver === address;
}

export type UnknownEvent = {
    event: string;
    sender: string;
    receiver: string;
}

export type StreamDepositEvent = {
    event: string
    sender: string;
    receiver: string;
    amount: Coin[];
};

export type CreateStreamEvent = {
    event: string
    sender: string;
    receiver: string;
    flowRate: number;
};

export type ClaimStreamEvent = {
    event: string
    sender: string;
    receiver: string;
    amountReceived: Coin[];
    amountValFee: Coin[];
};

export type UpdateFlowRateEvent = {
    event: string
    sender: string;
    receiver: string;
    oldFlowRate: number;
    newFlowRate: number;
};

export type CancelStreamEvent = {
    event: string
    sender: string;
    receiver: string;
    amountRefunded: Coin[];
};


export function parseStreamDeposit(
    e: any
): StreamDepositEvent {
    const event = e.type
    const sender = getAttr(e.attributes, "sender")
    const receiver = getAttr(e.attributes, "receiver")
    const amount = parseCoins(getAttr(e.attributes, "amount_deposited"));
    return {
        event, sender, receiver, amount
    }
}

export function parseCreateStream(
    e: any
): CreateStreamEvent {
    const event = e.type
    const sender = getAttr(e.attributes, "sender")
    const receiver = getAttr(e.attributes, "receiver")
    const flowRate = parseInt(getAttr(e.attributes, "flow_rate"))
    return {
        event, sender, receiver, flowRate
    }

}

export function parseClaimStream(
    e: any
): ClaimStreamEvent {
    const event = e.type
    const sender = getAttr(e.attributes, "sender")
    const receiver = getAttr(e.attributes, "receiver")
    const amountReceived = parseCoins(getAttr(e.attributes, "amount_received"));
    const amountValFee = parseCoins(getAttr(e.attributes, "validator_fee"));
    return {
        event, sender, receiver, amountReceived, amountValFee
    }
}

export function parseUpdateFlowRate(
    e: any
): UpdateFlowRateEvent {
    const event = e.type
    const sender = getAttr(e.attributes, "sender")
    const receiver = getAttr(e.attributes, "receiver")
    const oldFlowRate = parseInt(getAttr(e.attributes, "old_flow_rate"),10);
    const newFlowRate = parseInt(getAttr(e.attributes, "new_flow_rate"), 10);
    return {
        event, sender, receiver, oldFlowRate, newFlowRate
    }
}

export function parseCancelStream(
    e: any
): CancelStreamEvent {
    const event = e.type
    const sender = getAttr(e.attributes, "sender")
    const receiver = getAttr(e.attributes, "receiver")
    const amountRefunded = parseCoins(getAttr(e.attributes, "refund_amount"));

    return {
       event, sender, receiver, amountRefunded
    }
}

export function isStreamEvent(e: any) {
    switch (e.type) {
        case "stream_deposit":
        case "create_stream":
        case "claim_stream":
        case "update_flow_rate":
        case "cancel_stream":
            return true
        default:
            return false
    }
}

export function parseEvent(e: any): StreamDepositEvent | CreateStreamEvent | ClaimStreamEvent | UpdateFlowRateEvent | CancelStreamEvent | UnknownEvent {
    switch (e.type) {
        case "stream_deposit":
            return parseStreamDeposit(e);
        case "create_stream":
            return parseCreateStream(e);
        case "claim_stream":
            return parseClaimStream(e);
        case "update_flow_rate":
            return parseUpdateFlowRate(e);
        case "cancel_stream":
            return parseCancelStream(e);
    }
    return {event: "unknown", sender: "", receiver: ""};
}
