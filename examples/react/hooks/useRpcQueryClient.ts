import { mainchain } from "@unification-com/fundjs-react";
import { useQuery } from "@tanstack/react-query";
import { useQueryHooks } from "./useQueryHooks";

const { createRPCQueryClient } = mainchain.ClientFactory;

const fetchRpcQueryClient = async (rpcEndpoint: string) => {
  return createRPCQueryClient({ rpcEndpoint });
};

export const useRpcQueryClient = (chainName: string) => {
  const { rpcEndpoint } = useQueryHooks(chainName);

  const rpcQueryClientQuery = useQuery({
    queryKey: ["rpcQueryClient", rpcEndpoint],
    queryFn: () => createRPCQueryClient(rpcEndpoint || ""),
    enabled: Boolean(rpcEndpoint),
    staleTime: Infinity,
  });

  return { rpcQueryClient: rpcQueryClientQuery?.data };
};
