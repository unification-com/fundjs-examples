import { useEffect, useMemo, useState } from 'react';
import { useChain } from '@cosmos-kit/react';
import { useQueryHooks } from '.';

(BigInt.prototype as any).toJSON = function () {
    return this.toString();
};

export function useQueryBalance(chainName: string, denom: string) {
    const [isLoading, setIsLoading] = useState(false);
    const { address } = useChain(chainName);
    const { cosmos, isReady, isFetching } = useQueryHooks(chainName);

    const balanceQuery = cosmos.bank.v1beta1.useBalance({
        request: {
            address: (address) ? address : '',
            denom
        },
        options: {
            enabled: isReady,
            staleTime: Infinity,
            select: ({balance}) => balance,
        },
    })

    const singleQueries = {
        balance: balanceQuery,
    };

    const staticQueries = [
        singleQueries.balance,
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
        balanceQuery.refetch();
    };

    return { data: { ...singleQueriesData }, isLoading, refetch };
}
