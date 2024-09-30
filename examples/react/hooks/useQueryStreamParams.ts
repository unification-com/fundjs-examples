import { useEffect, useMemo, useState } from "react";
import { useChain } from "@cosmos-kit/react";
import { useQueryHooks } from ".";

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

const useLoadingEffect = (
  isFetching: boolean,
  staticQueriesFetching: boolean
) => {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(isFetching || staticQueriesFetching);
  }, [isFetching, staticQueriesFetching]);

  return isLoading;
};

const removeStaticQueries = (staticQueries: any[]) => {
  staticQueries.forEach((query) => query?.remove());
};

export function useQueryStreamParams(chainName: string) {
  const { address } = useChain(chainName);
  const { mainchain, isReady, isFetching } = useQueryHooks(chainName);

  // Query to fetch stream parameters
  const paramsQuery = mainchain?.stream?.v1?.useParams({
    request: {},
    options: {
      enabled: isReady,
      staleTime: Infinity,
      select: ({ params }) => params,
    },
  });

  const staticQueries = [paramsQuery];
  const isStaticQueriesFetching = staticQueries.some(
    (query) => query?.isFetching
  );
  const isLoading = useLoadingEffect(isFetching, isStaticQueriesFetching);

  useEffect(() => {
    removeStaticQueries(staticQueries);
  }, [chainName]);

  const singleQueriesData = useMemo(() => {
    if (!isReady || isStaticQueriesFetching) return undefined;

    return {
      params: paramsQuery?.data,
    };
  }, [isReady, isStaticQueriesFetching]);

  const refetch = () => {
    paramsQuery?.refetch();
  };

  return { data: singleQueriesData, isLoading, refetch };
}
