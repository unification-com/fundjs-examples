import React, { useState, useCallback, useEffect } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
// @ts-ignore
import { v4 as uuidv4 } from 'uuid';
import { truncateAddress, getExplorer } from '@/utils'
import {Box, Text, Stack, ListItem, Link} from "@interchain-ui/react";
import {useChain} from "@cosmos-kit/react";

export type WebSocketProps = {
    chainName: string;
};

export const WebSocket = ({chainName}: WebSocketProps) => {
    const { chain, address } = useChain(chainName);
    const [socketUrl, setSocketUrl] = useState('');
    const [messageHistory, setMessageHistory] = useState<React.JSX.Element[]>([]);
    const [isSubscribed, setIsSubscribed] = useState(false);

    useEffect(() => {
        if(chain.apis?.wss) {
            setSocketUrl(chain.apis?.wss[0].address)
        } else if(chain.apis?.rpc) {
            const wss = chain.apis?.rpc[0].address.replace("http", "ws")
            setSocketUrl(`${wss}/websocket`)
        }
    }, [chain]);

    const explorer = getExplorer(chainName)

    const { sendMessage, lastMessage, readyState } = useWebSocket(socketUrl, { share: true });

    function formatExplorerUrl(value: string, what: string, truncate: boolean): React.JSX.Element {
        let url = ''
        switch(what) {
            case "account":
                if(explorer.account_page !== undefined && value != null) {
                    url = explorer.account_page.replace("${accountAddress}", value)
                }
                break
            case "tx":
                if(explorer.tx_page !== undefined && value != null) {
                    url = explorer.tx_page.replace("${txHash}", value)
                }
                break
        }

        if(url !== '') {
            return <Link href={url} target={"_blank"}>{truncate? truncateAddress(value) : value}</Link>
        }
        return <>{value}</>
    }

    function getAttr(attributes: any[], which: string): string {
        const a = attributes.find((attr) => attr.key === which)
        return a?.value
    }

    function isSenderOrReceiver(attributes: any[]): boolean {
        const sender = getAttr(attributes, "sender")
        const receiver = getAttr(attributes, "receiver")
        return sender === address || receiver === address;
    }

    function parseStreamDeposit(attributes: any[], txHash: string): React.JSX.Element {
        const sender = formatExplorerUrl(getAttr(attributes, "sender"), "account", true)
        const receiver = formatExplorerUrl(getAttr(attributes, "receiver"), "account", true)
        const amount = getAttr(attributes, "amount_deposited")
        const txHashLink = formatExplorerUrl(txHash, "tx", true)
        return <>Tx {txHashLink} - Top Up deposit: {sender} -&gt; {receiver}: {amount}</>
    }

    function parseCreateStream(attributes: any[], txHash: string): React.JSX.Element {
        const sender = formatExplorerUrl(getAttr(attributes, "sender"), "account", true)
        const receiver = formatExplorerUrl(getAttr(attributes, "receiver"), "account", true)
        const flowRate = getAttr(attributes, "flow_rate")
        const txHashLink = formatExplorerUrl(txHash, "tx", true)
        return <>Tx {txHashLink} - Create Stream: {sender} -&gt; {receiver}: {flowRate} nund/sec</>
    }

    function parseClaimStream(attributes: any[], txHash: string): React.JSX.Element {
        const sender = formatExplorerUrl(getAttr(attributes, "sender"), "account", true)
        const receiver = formatExplorerUrl(getAttr(attributes, "receiver"), "account", true)
        const amount = getAttr(attributes, "claim_total")
        const txHashLink = formatExplorerUrl(txHash, "tx", true)
        return <>Tx {txHashLink} - Claim Stream: {sender} -&gt; {receiver}: {amount}</>
    }

    function parseUpdateFlowRate(attributes: any[], txHash: string): React.JSX.Element {
        const sender = formatExplorerUrl(getAttr(attributes, "sender"), "account", true)
        const receiver = formatExplorerUrl(getAttr(attributes, "receiver"), "account", true)
        const oldFlowRate = getAttr(attributes, "old_flow_rate")
        const newFlowRate = getAttr(attributes, "new_flow_rate")
        const txHashLink = formatExplorerUrl(txHash, "tx", true)
        return <>Tx {txHashLink} - Update Flow Rate: {sender} -&gt; {receiver} from {oldFlowRate} to {newFlowRate} nund/sec</>
    }

    function parseCancelStream(attributes: any[], txHash: string): React.JSX.Element {
        const sender = formatExplorerUrl(getAttr(attributes, "sender"), "account", true)
        const receiver = formatExplorerUrl(getAttr(attributes, "receiver"), "account", true)
        const txHashLink = formatExplorerUrl(txHash, "tx", true)
        return <>Tx {txHashLink} - Stream Cancelled: {sender} -&gt; {receiver}</>
    }

    function parseEvent(e: any, txHash: string):React.JSX.Element | null {
        if(isSenderOrReceiver(e.attributes)) {
            switch (e.type) {
                case "stream_deposit":
                    return parseStreamDeposit(e.attributes, txHash)
                case "create_stream":
                    return parseCreateStream(e.attributes, txHash)
                case "claim_stream":
                    return parseClaimStream(e.attributes, txHash)
                case "update_flow_rate":
                    return parseUpdateFlowRate(e.attributes, txHash)
                case "cancel_stream":
                    return parseCancelStream(e.attributes, txHash)
            }
        }
        return null
    }

    useEffect(() => {
        if (lastMessage !== null) {
            const res = JSON.parse(lastMessage.data.toString())
            let prev = [...messageHistory]
            let txHash = ''
            if(res.result?.events) {
                txHash = res.result?.events["tx.hash"][0]
            }

            for(let i = 0; i < res.result.data?.value.TxResult.result.events.length; i++) {
                const e = res.result.data?.value.TxResult.result.events[i]
                const msg = parseEvent(e, txHash)
                if(msg !== null) {
                    if(prev.length >= 10) {
                        prev.pop()
                    }
                    prev = [msg].concat(prev)
                }
            }

            setMessageHistory(prev);
        }
    }, [lastMessage]);

    useEffect(() => {
        if(readyState === ReadyState.OPEN && !isSubscribed) {
            sendMessage(JSON.stringify({ "jsonrpc": "2.0", "method": "subscribe", "params":
                    ["message.module='stream'"], "id": uuidv4() }))
            setIsSubscribed(true);
        }
    }, [readyState, isSubscribed]);

    const connectionStatus = {
        [ReadyState.CONNECTING]: 'Connecting',
        [ReadyState.OPEN]: 'Open',
        [ReadyState.CLOSING]: 'Closing',
        [ReadyState.CLOSED]: 'Closed',
        [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
    }[readyState];

    return (
        <Box borderRadius="$lg" backgroundColor="$cardBg" px="$4" py="$4">
            <Text fontSize={"$lg"} fontWeight={"$bold"}>Websocket events for {address} Payment Streams</Text>
            <Text>The WebSocket is currently {connectionStatus}</Text>
            <Stack as="ul" space="1" direction="vertical">
                {messageHistory.map((message, idx) => (
                    <ListItem key={`ws_event${idx}`}>- {message ? message : null}</ListItem>
                ))}
            </Stack>
        </Box>
    );
};
