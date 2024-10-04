import {useEffect, useMemo, useState} from "react";
import {useQueryHooks} from ".";

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

export type CalculateFlowRateOptions = {
  coin: string;
  period: number;
  duration: number;
};

export function useCalculateFlowRate(chainName: string) {
  const [isCalculating, setIsCalculating] = useState(false);
  const [isDataReady, setIsDataReady] = useState(false);
  const [qCoin, setQCoin] = useState("100000000000nund");
  const [qPeriod, setQPeriod] = useState(6);
  const [qDuration, setQDuration] = useState(1);
  const { mainchain, isReady, isFetching } = useQueryHooks(chainName);

  const queryCalculateFlowRate =
      mainchain.stream.v1.useCalculateFlowRate({
        request: {
          coin: qCoin,
          period: qPeriod,
          duration: BigInt(qDuration),
        },
        options: {
          enabled: isReady,
          staleTime: Infinity,
          // select: ({streams, pagination}) => streams,
        },
      });

  useEffect(() => {
    queryCalculateFlowRate.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chainName]);

  const isQueryFetching = queryCalculateFlowRate.isFetching
  const loading = isFetching || isQueryFetching

  useEffect(() => {
    // no loading when refetching
    if (isFetching || isQueryFetching) setIsCalculating(true);
    if (!loading) setIsCalculating(false);
  }, [isQueryFetching, loading]);

  const queryData = useMemo(() => {
    if (isQueryFetching || !isReady) return;
    setIsDataReady(true)
    return queryCalculateFlowRate.data;

  }, [isQueryFetching, isReady]);


  function onCalculateFlowRate({
    coin,
    period,
    duration,
  }: CalculateFlowRateOptions) {
    setQCoin(coin)
    setQPeriod(period)
    setQDuration(duration)
    setIsDataReady(false)
    queryCalculateFlowRate.refetch()
  }

  return { data: {...queryData}, isCalculating, isDataReady, onCalculateFlowRate };
}
