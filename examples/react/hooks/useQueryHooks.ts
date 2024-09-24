import {useChain} from '@cosmos-kit/react';
import {
    useRpcEndpoint,
    useRpcClient,
    createRpcQueryHooks
} from '@unification-com/fundjs-react';

export const useQueryHooks = (chainName: string, extraKey?: string) => {
    const {getRpcEndpoint} = useChain(chainName);

    const rpcEndpointQuery = useRpcEndpoint({
        getter: getRpcEndpoint,
        options: {
            staleTime: Infinity,
            queryKeyHashFn: (queryKey) => {
                const key = [...queryKey, chainName];
                return JSON.stringify(extraKey ? [...key, extraKey] : key);
            },
        },
    });

    const rpcClientQuery = useRpcClient({
        rpcEndpoint: rpcEndpointQuery.data || '',
        options: {
            enabled: Boolean(rpcEndpointQuery.data),
            staleTime: Infinity,
            queryKeyHashFn: (queryKey) => {
                return JSON.stringify(extraKey ? [...queryKey, extraKey] : queryKey);
            },
        },
    });

    const {cosmos, mainchain} = createRpcQueryHooks({
        rpc: rpcClientQuery.data,
    });

    const isReady = Boolean(rpcClientQuery.data);
    const isFetching = rpcEndpointQuery.isFetching || rpcClientQuery.isFetching;

    return {
        cosmos,
        mainchain,
        isReady,
        isFetching,
        rpcEndpoint: rpcEndpointQuery.data,
    };
};
