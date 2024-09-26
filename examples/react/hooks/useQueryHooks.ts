import { useChain } from "@cosmos-kit/react";
import {
  useRpcEndpoint,
  useRpcClient,
  createRpcQueryHooks,
} from "@unification-com/fundjs-react";

export const useQueryHooks = (chainName: string, extraKey?: string) => {
  const { getRpcEndpoint } = useChain(chainName);

  const generateQueryKeyHash = (queryKey: readonly any[]) => {
    const key = [...queryKey, chainName];
    return JSON.stringify(extraKey ? [...key, extraKey] : key);
  };

  const rpcEndpointQuery = useRpcEndpoint({
    getter: getRpcEndpoint,
    options: {
      staleTime: Infinity,
      queryKeyHashFn: generateQueryKeyHash,
    },
  });

  const rpcClientQuery = useRpcClient({
    rpcEndpoint: rpcEndpointQuery.data || "",
    options: {
      enabled: Boolean(rpcEndpointQuery.data),
      staleTime: Infinity,
      queryKeyHashFn: generateQueryKeyHash,
    },
  });

  const { cosmos, mainchain } = createRpcQueryHooks({
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
