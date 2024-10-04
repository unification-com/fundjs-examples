import {Box, Link, ListItem, Stack, Text} from "@interchain-ui/react";
import {getExplorer, isStreamEvent, parseEvent, truncateAddress} from "@/utils";
import React from "react";
import {TxResponse} from "cosmjs-types/cosmos/base/abci/v1beta1/abci";
import {ExplorerLink} from "@/components/streams/ExplorerLink";
import {StreamEventFull} from "@/components/streams/StreamEventFull";

export type TxProps = {
    tx: TxResponse,
    chainName: string,
}

export const Tx = ({ tx, chainName }: TxProps) => {
    const events = []

    for(let i = 0; i < tx.events.length; i+=1) {
        const e = tx.events[i];
        if(isStreamEvent(e)) {
            const eventRes = parseEvent(e)
            events.push(
                <StreamEventFull chainName={chainName} e={eventRes}/>
            )
        }
    }

    console.log(tx)

    return (
        <Box
            borderRadius={"$md"}
            backgroundColor="$cardBg"
            px="$5"
            py="$4"
        >
            <Stack direction={"horizontal"} space={"$2"}>
                <Text fontWeight={"$bold"}>
                    Transaction <ExplorerLink chainName={chainName} value={tx.txhash} what={"tx"} truncate={true}/>
                </Text>
                <Text fontWeight={"$bold"}>at {new Date(tx.timestamp).toLocaleString('en-GB')}</Text>
            </Stack>
            <Box>
                <Stack direction="vertical" space="$1">
                    {events}
                </Stack>
            </Box>
        </Box>
    )
}
