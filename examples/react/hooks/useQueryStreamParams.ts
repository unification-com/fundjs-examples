import {useEffect, useMemo, useState} from 'react';
import {useChain} from '@cosmos-kit/react';
import {useQueryHooks} from '.';

(BigInt.prototype as any).toJSON = function () {
    return this.toString();
};

export function useQueryStreamParams(chainName: string) {
    const [isLoading, setIsLoading] = useState(false);
    const {address} = useChain(chainName);
    const {mainchain, isReady, isFetching} = useQueryHooks(chainName);

    const paramsQuery = mainchain.stream.v1.useParams({
        request: {},
        options: {
            enabled: isReady,
            staleTime: Infinity,
            select: ({params}) => params,
        },
    })

    const singleQueries = {
        params: paramsQuery,
    };

    const staticQueries = [
        singleQueries.params,
    ];

    useEffect(() => {
        staticQueries.forEach((query) => query.remove());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chainName]);

    const isStaticQueriesFetching = staticQueries.some(
        ({isFetching}) => isFetching
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
        paramsQuery.refetch();
    };

    return {data: {...singleQueriesData}, isLoading, refetch};
}
