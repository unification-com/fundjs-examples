import {Box, Button, Link, ListItem, Spinner, Stack, Text} from "@interchain-ui/react";
import {TxResponse} from "cosmjs-types/cosmos/base/abci/v1beta1/abci";
import React, {useEffect, useState} from "react";
import {useQueryStreamTxs} from "@/hooks/useQueryStreamTxs";
import {ExplorerLink} from "@/components/streams/ExplorerLink";
import {usePagination} from "@/hooks";
import {Tx} from "@/components/streams/Tx";


export type TxHistoryProps = {
    chainName: string,
    sender: string,
    receiver: string,
}

export const TxHistory = ({ chainName, sender, receiver }: TxHistoryProps) => {

    const {data, isLoading} = useQueryStreamTxs(chainName, sender, receiver);
    const { activePage, nextPage, previousPage, totalPages, totalItems, items } = usePagination(data as [], 1, 5);

    if (isLoading) {
        return <Text><Spinner /></Text>;
    }

    if (data !== undefined) {
        console.log(data)

        return (
            <Box position="relative">
                <Text fontSize={"$xl"} fontWeight={"$bold"}>
                    Transaction History
                </Text>
                <Text fontSize={"$lg"} fontWeight={"$bold"}>
                    Sender: <ExplorerLink chainName={chainName} value={sender} what={"account"} truncate={false} />
                </Text>
                <Text fontSize={"$lg"} fontWeight={"$bold"}>
                    Receiver: <ExplorerLink chainName={chainName} value={receiver} what={"account"} truncate={false} />
                </Text>
                <Stack direction="vertical" space="$6">
                {(items as TxResponse[])?.map((tx, idx) => (
                    <Box key={`tx_history_${idx}`}>
                        <Tx chainName={chainName} tx={tx} />
                    </Box>
                ))}
                </Stack>

                <br />
                <Stack direction="horizontal" space="$6" align={"center"}>
                    <Button
                        intent="secondary"
                        size={"sm"}
                        onClick={previousPage}
                        disabled={activePage <= 1}
                    >
                        Previous
                    </Button>
                    <Text>{activePage}/{totalPages}</Text>
                    <Button
                        intent="secondary"
                        size={"sm"}
                        onClick={nextPage}
                        disabled={activePage >= totalPages}
                    >
                        Next
                    </Button>
                </Stack>
            </Box>
        );
    }
    return <></>;
}
