import {useEffect, useMemo, useState} from "react";
import {useQueryHooks} from ".";

(BigInt.prototype as any).toJSON = function () {
    return this.toString();
};

export function useQueryAccountInfo(chainName: string, addr: string) {
    const [isLoading, setIsLoading] = useState(false);
    const [address, setAddress] = useState(addr)

    const { cosmos, isReady, isFetching } = useQueryHooks(chainName);

    function setQueryData(a: string) {
        if (a !== "") {
            setAddress(a)
        }
    }

    const query = cosmos.auth.v1beta1.useAccount({
        request: {
            address
        },
        options: {
            enabled: isReady && address !== "",
            staleTime: Infinity,
        },
    })

    useEffect(() => {
        query.remove()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chainName, address]);

    const isQueryFetching = query.isFetching

    const loading = isFetching || isQueryFetching

    useEffect(() => {
        // no loading when refetching
        if (isFetching || isQueryFetching) setIsLoading(true);
        if (!loading) setIsLoading(false);
    }, [isQueryFetching, loading]);

    const queriesData = useMemo(() => {
        if (isQueryFetching || !isReady) return;
        return {data: query.data, error: query.error}
    }, [isQueryFetching, isReady]);

    return { data: queriesData, isLoading, setQueryData, refetch: query.refetch };
}
