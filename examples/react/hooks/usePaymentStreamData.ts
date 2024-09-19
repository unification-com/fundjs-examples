import { useEffect, useMemo, useState } from 'react';
import { useChain } from '@cosmos-kit/react';
import { useQueryHooks } from '.';
import { paginate } from '@/utils';

(BigInt.prototype as any).toJSON = function () {
    return this.toString();
};

export function usePaymentStreamData(chainName: string) {
    const [isLoading, setIsLoading] = useState(false);
    const { address } = useChain(chainName);
    const { mainchain, isReady, isFetching } = useQueryHooks(chainName);

    const paymentStreamsQueryAsSender = mainchain.stream.v1.useAllStreamsForSender({
        request: {
            senderAddr: (address) ? address : '',
            pagination: paginate(50n, true),
        },
        options: {
            enabled: isReady,
            staleTime: Infinity,
            select: ({streams}) => streams,
        },
    })

    const paymentStreamsQueryAsReceiver = mainchain.stream.v1.useAllStreamsForReceiver({
        request: {
            receiverAddr: (address) ? address : '',
            pagination: paginate(50n, true),
        },
        options: {
            enabled: isReady,
            staleTime: Infinity,
            select: ({streams}) => streams,
        },
    })

    const singleQueries = {
        streamsAsSender: paymentStreamsQueryAsSender,
        streamsAsReceiver: paymentStreamsQueryAsReceiver,
    };

    const staticQueries = [
        singleQueries.streamsAsSender,
        singleQueries.streamsAsReceiver,
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
        if (isStaticQueriesFetching || !isReady || !address) return;

        return Object.fromEntries(
            Object.entries(singleQueries).map(([key, query]) => [key, query.data])
        ) as SingleQueriesData;
    }, [isStaticQueriesFetching, isReady, address]);

    const refetch = () => {
        paymentStreamsQueryAsSender.refetch();
        paymentStreamsQueryAsReceiver.refetch();
    };

    return { data: { ...singleQueriesData }, isLoading, refetch };
}
