import React, { useState, useCallback, useEffect } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
// @ts-ignore
import { v4 as uuidv4 } from 'uuid';
import { truncateAddress } from '@/utils'
import {Box, Text, Stack, ListItem} from "@interchain-ui/react";
import {useChain} from "@cosmos-kit/react";

export type WebSocketProps = {
    chainName: string;
};

export const WebSocket = ({chainName}: WebSocketProps) => {
    const { chain } = useChain(chainName);
    const [socketUrl, setSocketUrl] = useState('');
    const [messageHistory, setMessageHistory] = useState<string[]>([]);
    const [isSubscribed, setIsSubscribed] = useState(false);

    useEffect(() => {
        if(chain.apis?.wss) {
            setSocketUrl(chain.apis?.wss[0].address)
        } else if(chain.apis?.rpc) {
            const wss = chain.apis?.rpc[0].address.replace("http", "ws")
            setSocketUrl(`${wss}/websocket`)
        }
    }, [chain]);

    const { sendMessage, lastMessage, readyState } = useWebSocket(socketUrl, { share: true });

    function getWalletAddress(attributes: any[], which: string): string {
        return truncateAddress(getAttr(attributes, which), 20, "...")
    }

    function getAttr(attributes: any[], which: string): string {
        const a = attributes.find((attr) => attr.key === which)
        return a.value
    }

    function parseStreamDeposit(attributes: any[]): string {
        let msg = ''
        const sender = getWalletAddress(attributes, "sender")
        const receiver = getWalletAddress(attributes, "receiver")
        const amount = getAttr(attributes, "amount_deposited")
        msg = `Top Up deposit: ${sender} -> ${receiver}: ${amount}`
        return msg
    }

    function parseCreateStream(attributes: any[]): string {
        let msg = ''
        const sender = getWalletAddress(attributes, "sender")
        const receiver = getWalletAddress(attributes, "receiver")
        const flowRate = getAttr(attributes, "flow_rate")
        msg = `Create Stream: ${sender} -> ${receiver}: ${flowRate} nund/sec`
        return msg
    }

    function parseClaimStream(attributes: any[]): string {
        let msg = ''
        const sender = getWalletAddress(attributes, "sender")
        const receiver = getWalletAddress(attributes, "receiver")
        const amount = getAttr(attributes, "claim_total")
        msg = `Claim Stream: ${sender} -> ${receiver}: ${amount}`
        return msg
    }

    function parseUpdateFlowRate(attributes: any[]): string {
        let msg = ''
        const sender = getWalletAddress(attributes, "sender")
        const receiver = getWalletAddress(attributes, "receiver")
        const oldFlowRate = getAttr(attributes, "old_flow_rate")
        const newFlowRate = getAttr(attributes, "new_flow_rate")
        msg = `Update Flow Rate: ${sender} -> ${receiver} from ${oldFlowRate} to ${newFlowRate} nund/sec`
        return msg
    }

    function parseCancelStream(attributes: any[]): string {
        let msg = ''
        const sender = getWalletAddress(attributes, "sender")
        const receiver = getWalletAddress(attributes, "receiver")
        msg = `Stream Cancelled: ${sender} -> ${receiver}`
        return msg
    }

    function parseEvent(e: any):string {
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

    useEffect(() => {
        if (lastMessage !== null) {
            const res = JSON.parse(lastMessage.data.toString())
            let prev = [...messageHistory]
            const blockHeight = res.result.data?.value.TxResult.height

            for(let i = 0; i < res.result.data?.value.TxResult.result.events.length; i++) {
                const e = res.result.data?.value.TxResult.result.events[i]
                const msg = parseEvent(e)
                if(msg !== '') {
                    if(prev.length >= 10) {
                        prev.pop()
                    }
                    prev = [`Block #${blockHeight}: ${msg}`].concat(prev)
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
            <Text fontSize={"$xl"} fontWeight={"$bold"}>Websocket events</Text>
            <Text>The WebSocket is currently {connectionStatus}</Text>
            <Stack as="ul" space="1" direction="vertical">
                {messageHistory.map((message, idx) => (
                    <ListItem key={`ws_event${idx}`}>- {message ? message : null}</ListItem>
                ))}
            </Stack>
        </Box>
    );
};
