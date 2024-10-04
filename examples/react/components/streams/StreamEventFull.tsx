import {
    CancelStreamEvent,
    ClaimStreamEvent,
    CreateStreamEvent, exponentiate, getCoin, getExponent,
    StreamDepositEvent,
    UnknownEvent,
    UpdateFlowRateEvent
} from "@/utils";
import {ExplorerLink} from "@/components/streams/ExplorerLink";
import React from "react";
import {parseCoins} from "@cosmjs/stargate";
import {Box, Text} from "@interchain-ui/react";

export type StreamEventFullProps = {
    e: StreamDepositEvent | CreateStreamEvent | ClaimStreamEvent | UpdateFlowRateEvent | CancelStreamEvent | UnknownEvent;
    chainName: string
}

export const StreamEventFull = ({ e, chainName }: StreamEventFullProps) => {

    const chainCoin = getCoin(chainName);
    const exponent = getExponent(chainName);
    let ev

    switch (e.event) {
        case "stream_deposit":
            ev = e as StreamDepositEvent
            const amountFund = exponentiate(ev.amount[0].amount, -exponent).toFixed(3);
            return (
                <Box>
                    <Text>Add deposit {amountFund} {chainCoin.symbol}</Text>
                </Box>
            )
        case "create_stream":
            ev = e as CreateStreamEvent
            const flowRateFund = exponentiate(ev.flowRate, -exponent).toFixed(9);
            return (
                <Box>
                    <Text>Create Stream with Flow Rate: {flowRateFund} {chainCoin.symbol}/sec</Text>
                </Box>
            )
        case "claim_stream":
            ev = e as ClaimStreamEvent
            const amountReceivedFund = exponentiate(
                ev.amountReceived[0].amount,
                -exponent
            ).toFixed(3);
            const amountValFeeFund = exponentiate(
                ev.amountValFee[0].amount,
                -exponent
            ).toFixed(3);
            return (
                <Box>
                    <Text>Claim. Received: {amountReceivedFund} {chainCoin.symbol} (Validator Fee: {amountValFeeFund} {chainCoin.symbol})</Text>
                </Box>
            )
        case "update_flow_rate":
            ev = e as UpdateFlowRateEvent
            const oldFlowRateFund = exponentiate(ev.oldFlowRate, -exponent).toFixed(9);
            const newFlowRateFund = exponentiate(ev.newFlowRate, -exponent).toFixed(9);
            return (
                <Box>
                    <Text>Update Flow Rate from {oldFlowRateFund} to {newFlowRateFund} {chainCoin.symbol}/sec</Text>
                </Box>
            )
        case "cancel_stream":
            ev = e as CancelStreamEvent

            const amountRefundedFund = exponentiate(
                ev.amountRefunded[0].amount,
                -exponent
            ).toFixed(3);

            return (
                <Box>
                    <Text>Stream Cancelled</Text>
                    <Text>Refund: {amountRefundedFund} {chainCoin.symbol}/sec</Text>
                </Box>
            )
    }

    return (<></>)
}
