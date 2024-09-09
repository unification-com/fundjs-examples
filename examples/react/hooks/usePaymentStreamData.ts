import { useEffect, useMemo, useState } from 'react';
import { useChain } from '@cosmos-kit/react';
import { useQueries } from '@tanstack/react-query';
import { Stream } from '@unification-com/fundjs-react/mainchain/stream/v1/stream';
import { useQueryHooks, useRpcQueryClient } from '.';
import { paginate } from '@/utils';

(BigInt.prototype as any).toJSON = function () {
    return this.toString();
};

export function usePaymentStreamData(chainName: string) {
    const [isLoading, setIsLoading] = useState(false);
    const { address } = useChain(chainName);
    const { rpcQueryClient } = useRpcQueryClient(chainName);
    const { mainchain, isReady, isFetching } = useQueryHooks(chainName);

    const paymentStreamsQuery = mainchain.stream.v1.useStreams({
        request: {
            pagination: paginate(50n, true),
        },
        options: {
            enabled: isReady,
            staleTime: Infinity,
            select: ({streams}) => streams,
        },
    })

    const singleQueries = {
        streams: paymentStreamsQuery,
    };

    const staticQueries = [
        singleQueries.streams,
    ];

    useEffect(() => {
        staticQueries.forEach((query) => query.remove());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chainName]);

    const isStaticQueriesFetching = staticQueries.some(
        ({ isFetching }) => isFetching
    );

    const loading =
        isFetching || isStaticQueriesFetching;

    useEffect(() => {
        // no loading when refetching
        if (isFetching || isStaticQueriesFetching) setIsLoading(true);
        if (!loading) setIsLoading(false);
    }, [isStaticQueriesFetching, loading]);

    type SingleQueries = typeof singleQueries;

    type SingleQueriesData = {
        [Key in keyof SingleQueries]: NonNullable<SingleQueries[Key]['data']>;
    };

    const singleQueriesData = useMemo(() => {
        if (isStaticQueriesFetching || !isReady) return;

        return Object.fromEntries(
            Object.entries(singleQueries).map(([key, query]) => [key, query.data])
        ) as SingleQueriesData;
    }, [isStaticQueriesFetching, isReady]);

    const refetch = () => {
        paymentStreamsQuery.forEach((query) => query.remove());
    };

    return { data: { ...singleQueriesData }, isLoading, refetch };
}
