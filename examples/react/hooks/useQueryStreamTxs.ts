import {useEffect, useMemo, useState} from "react";
import {useQueryHooks} from ".";
import {OrderBy} from "@unification-com/fundjs-react/cosmos/tx/v1beta1/service"
import {TxResponse} from "cosmjs-types/cosmos/base/abci/v1beta1/abci";
import {cosmos} from "@unification-com/fundjs-react";
import tx = cosmos.tx;

(BigInt.prototype as any).toJSON = function () {
    return this.toString();
};

export function useQueryStreamTxs(chainName: string, s: string, r: string) {
    const [isLoading, setIsLoading] = useState(false);
    const [sender, setSender] = useState(s)
    const [receiver, setReceiver] = useState(r)

    const { cosmos, isReady, isFetching } = useQueryHooks(chainName);

    function setQueryData(sender: string, receiver: string) {
        if (receiver !== "") {
            setReceiver(receiver)
        }
        if(sender !== "") {
            setSender(sender)
        }
    }

    const queryCreate = cosmos.tx.v1beta1.useGetTxsEvent({
        request: {
            events: [
                `create_stream.sender='${sender}'`,
                `create_stream.receiver='${receiver}'`
            ],
            orderBy: OrderBy.ORDER_BY_ASC
        },
        options: {
            enabled: isReady && sender !== "" && receiver !== "",
            staleTime: Infinity,
        },
    })

    const queryDeopsit = cosmos.tx.v1beta1.useGetTxsEvent({
        request: {
            events: [
                `stream_deposit.sender='${sender}'`,
                `stream_deposit.receiver='${receiver}'`
            ],
            orderBy: OrderBy.ORDER_BY_ASC
        },
        options: {
            enabled: isReady && sender !== "" && receiver !== "",
            staleTime: Infinity,
        },
    })

    const queryClaim = cosmos.tx.v1beta1.useGetTxsEvent({
        request: {
            events: [
                `claim_stream.sender='${sender}'`,
                `claim_stream.receiver='${receiver}'`
            ],
            orderBy: OrderBy.ORDER_BY_ASC
        },
        options: {
            enabled: isReady && sender !== "" && receiver !== "",
            staleTime: Infinity,
        },
    })

    const queryCancel = cosmos.tx.v1beta1.useGetTxsEvent({
        request: {
            events: [
                `cancel_stream.sender='${sender}'`,
                `cancel_stream.receiver='${receiver}'`
            ],
            orderBy: OrderBy.ORDER_BY_ASC
        },
        options: {
            enabled: isReady && sender !== "" && receiver !== "",
            staleTime: Infinity,
        },
    })

    const queryUpdateFlowRate = cosmos.tx.v1beta1.useGetTxsEvent({
        request: {
            events: [
                `update_flow_rate.sender='${sender}'`,
                `update_flow_rate.receiver='${receiver}'`
            ],
            orderBy: OrderBy.ORDER_BY_ASC
        },
        options: {
            enabled: isReady && sender !== "" && receiver !== "",
            staleTime: Infinity,
        },
    })

    const queries = {
        create: queryCreate,
        deposit: queryDeopsit,
        claim: queryClaim,
        cancel: queryCancel,
        updateFlowRate: queryUpdateFlowRate,
    }

    const queryArray = [
        queries.create,
        queries.deposit,
        queries.claim,
        queries.cancel,
        queries.updateFlowRate,
    ]

    useEffect(() => {
        queryArray.forEach((query) => query.remove());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chainName, sender, receiver]);

    const isQueriesFetching = queryArray.some(
        ({ isFetching }) => isFetching
    );

    const loading = isFetching || isQueriesFetching

    useEffect(() => {
        // no loading when refetching
        if (isFetching || isQueriesFetching) setIsLoading(true);
        if (!loading) setIsLoading(false);
    }, [isQueriesFetching, loading]);

    function processTxs(): TxResponse[] {
        const txs: TxResponse[] = [];

        Object.entries(queries).map(([key, query]) => {
            for(let i = 0; i < query.data?.txResponses.length; i += 1) {
                txs.push(query.data.txResponses[i])
            }
        })

        return txs.filter((obj1, i, arr) =>
            arr.findIndex(obj2 => (obj2.txhash === obj1.txhash)) === i
        ).sort(
            (a, b) => Number(a.height) - Number(b.height)
        )
    }

    const queriesData = useMemo(() => {
        if (isQueriesFetching || !isReady) return [] as TxResponse[];
        return processTxs() as TxResponse[]
    }, [isQueriesFetching, isReady]);

    return { data: queriesData, isLoading, setQueryData };
}


//get create stream events for sender/receiver
// https://rest-testnet.unification.io/cosmos/tx/v1beta1/txs?events=create_stream.sender%3D'und1d4qjey4qkj79ek4ah8350j9wzr009vcc823wa4'&events=create_stream.receiver%3D'und1xwp04mzdzrj5nz63rhxxkf2fjc8rjrt46xam8l'
//
// get claim stream events for sender/receiver
// https://rest-testnet.unification.io/cosmos/tx/v1beta1/txs?events=claim_stream.sender%3D'und1d4qjey4qkj79ek4ah8350j9wzr009vcc823wa4'&events=claim_stream.receiver%3D'und1xwp04mzdzrj5nz63rhxxkf2fjc8rjrt46xam8l'
//
// stream_deposit
// https://rest-testnet.unification.io/cosmos/tx/v1beta1/txs?events=stream_deposit.sender%3D'und1d4qjey4qkj79ek4ah8350j9wzr009vcc823wa4'&events=stream_deposit.receiver%3D'und1xwp04mzdzrj5nz63rhxxkf2fjc8rjrt46xam8l'
//
//
// update_flow_rate
// https://rest-testnet.unification.io/cosmos/tx/v1beta1/txs?events=update_flow_rate.sender%3D'und1d4qjey4qkj79ek4ah8350j9wzr009vcc823wa4'&events=update_flow_rate.receiver%3D'und1xwp04mzdzrj5nz63rhxxkf2fjc8rjrt46xam8l'
//
//
//
// cancel_stream
// https://rest-testnet.unification.io/cosmos/tx/v1beta1/txs?events=cancel_stream.sender%3D'und1d4qjey4qkj79ek4ah8350j9wzr009vcc823wa4'&events=cancel_stream.receiver%3D'und1xwp04mzdzrj5nz63rhxxkf2fjc8rjrt46xam8l'
