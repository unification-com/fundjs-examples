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

export type StreamEventProps = {
    e: StreamDepositEvent | CreateStreamEvent | ClaimStreamEvent | UpdateFlowRateEvent | CancelStreamEvent | UnknownEvent;
    chainName: string
}

export const StreamEvent = ({ e, chainName }: StreamEventProps) => {

    const chainCoin = getCoin(chainName);
    const exponent = getExponent(chainName);
    let ev

    switch (e.event) {
        case "stream_deposit":
            ev = e as StreamDepositEvent
            const amountFund = exponentiate(ev.amount[0].amount, -exponent).toFixed(3);
            return (<>
                Top Up deposit:
                <ExplorerLink chainName={chainName} value={ev.sender} what={"account"} truncate={true} />
                -&gt;
                <ExplorerLink chainName={chainName} value={ev.receiver} what={"account"} truncate={true} />
                {amountFund} {chainCoin.symbol}
            </>)
        case "create_stream":
            ev = e as CreateStreamEvent
            const flowRateFund = exponentiate(ev.flowRate, -exponent).toFixed(9);
            return (<>
                Create Stream:
                <ExplorerLink chainName={chainName} value={ev.sender} what={"account"} truncate={true} />
                -&gt;
                <ExplorerLink chainName={chainName} value={ev.receiver} what={"account"} truncate={true} />:{" "}
                {flowRateFund} {chainCoin.symbol}/sec
            </>)
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
            return (<>
                Claim Stream:
                <ExplorerLink chainName={chainName} value={ev.sender} what={"account"} truncate={true} />
                -&gt;
                <ExplorerLink chainName={chainName} value={ev.receiver} what={"account"} truncate={true} />{" "}
                : Received{" "}
                {amountReceivedFund} {chainCoin.symbol} (Val. fee {amountValFeeFund}{" "}
                {chainCoin.symbol})
            </>)
        case "update_flow_rate":
            ev = e as UpdateFlowRateEvent
            const oldFlowRateFund = exponentiate(ev.oldFlowRate, -exponent).toFixed(9);
            const newFlowRateFund = exponentiate(ev.newFlowRate, -exponent).toFixed(9);
            return (<>
                Update Flow Rate:
                <ExplorerLink chainName={chainName} value={ev.sender} what={"account"} truncate={true} />
                -&gt;
                <ExplorerLink chainName={chainName} value={ev.receiver} what={"account"} truncate={true} />
                from{" "}
                {oldFlowRateFund} to {newFlowRateFund} {chainCoin.symbol}/sec
            </>)
        case "cancel_stream":
            ev = e as CancelStreamEvent

            const amountRefundedFund = exponentiate(
                ev.amountRefunded[0].amount,
                -exponent
            ).toFixed(3);

            return (<>
                Stream Cancelled:
                <ExplorerLink chainName={chainName} value={ev.sender} what={"account"} truncate={true} />
                -&gt;
                <ExplorerLink chainName={chainName} value={ev.receiver} what={"account"} truncate={true} />
                . Refunded{" "}
                {amountRefundedFund} {chainCoin.symbol}
            </>)
    }

    return (<></>)
}
