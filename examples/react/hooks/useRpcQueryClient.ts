import {mainchain} from '@unification-com/fundjs-react';
import {useQuery} from '@tanstack/react-query';
import {useQueryHooks} from './useQueryHooks';

const {createRPCQueryClient} = mainchain.ClientFactory;

export const useRpcQueryClient = (chainName: string) => {
    const {rpcEndpoint} = useQueryHooks(chainName);

    const rpcQueryClientQuery = useQuery({
        queryKey: ['rpcQueryClient', rpcEndpoint],
        queryFn: () => createRPCQueryClient({rpcEndpoint: rpcEndpoint || ''}),
        enabled: Boolean(rpcEndpoint),
        staleTime: Infinity,
    });

    return {rpcQueryClient: rpcQueryClientQuery.data};
};
