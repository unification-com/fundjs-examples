import {  useState } from 'react';
import { useRpcQueryClient } from '.';
import {toast} from "@interchain-ui/react";

(BigInt.prototype as any).toJSON = function () {
    return this.toString();
};

export type onCalculateFlowRateOptions = {
    coin: string;
    period: number;
    duration: number;
    success?: (flowRate: string) => void
    error?: () => void
}

export function useCalculateFlowRate(chainName: string) {
    const { rpcQueryClient } = useRpcQueryClient(chainName);
    const [isCalculating, setIsCalculating] = useState(false);

    async function onCalculateFlowRate({ coin, period, duration, success = (flowRate) => { }, error = () => { } }: onCalculateFlowRateOptions) {

        try {
            setIsCalculating(true)
            const res = await rpcQueryClient?.mainchain.stream.v1.calculateFlowRate(
                {
                    coin, period, duration: BigInt(duration),
                }
            )

            if (!res?.flowRate) {
                error();
                console.error(res);
                toast.error('Error calculating flow rate');
            } else {
                success(res.flowRate.toString());
                toast.success('Calculate Flow Rate successful');
            }
        } catch (e) {
            error();
            console.error(e);
            toast.error('Calculate fLow rate failed');
        } finally {
            setIsCalculating(false);
        }

    }

    return { isCalculating, onCalculateFlowRate }

}
