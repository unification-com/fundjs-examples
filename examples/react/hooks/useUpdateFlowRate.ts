import { useState } from 'react';
import { mainchain } from '@unification-com/fundjs-react';
import { toast } from '@interchain-ui/react';
import { useChain } from '@cosmos-kit/react';
import { coins, StdFee, coin, parseCoins, Coin } from '@cosmjs/stargate';
import { useTx } from '@/hooks';
import { getCoin } from '@/utils';

const MessageComposer = mainchain.stream.v1.MessageComposer;

export type onUpdateFlowRateOptions = {
    receiver: string;
    flowRate: number;
    success?: (newFlowRate: string, depositZeroTime: string, remainingDeposit: string) => void
    error?: () => void
}

export function useUpdateFlowRate(chainName: string) {
    const { tx } = useTx(chainName);
    const { address } = useChain(chainName);
    const [isUpdatingFlowRate, setIsUpdatingFlowRate] = useState(false);

    const chainCoin = getCoin(chainName);

    async function onUpdateFlowRate({ receiver, flowRate, success = (newFlowRate, depositZeroTime, remainingDeposit) => { }, error = () => { } }: onUpdateFlowRateOptions) {
        if (!address) return;

        const msg = MessageComposer.withTypeUrl.updateFlowRate({
            receiver,
            sender: address,
            flowRate: BigInt(flowRate),
        });

        const fee: StdFee = {
            amount: coins('1000', chainCoin.base),
            gas: '1000000',
        };

        try {
            setIsUpdatingFlowRate(true);
            const res = await tx([msg], { fee });
            if (res.error) {
                error();
                console.error(res.error);
                toast.error(res.errorMsg);
            } else {
                let newFlowRate = '';
                let depositZeroTime = '';
                let remainingDeposit = ''
                if(res.response?.events) {
                    for(let i = 0; i < res.response?.events.length; i += 1) {
                        const e = res.response?.events[i]
                        if(e?.type === "update_flow_rate") {
                            for(let j = 0; j < e.attributes.length; j += 1) {
                                const a = e.attributes[j]
                                if(a.key === "new_flow_rate") {
                                    newFlowRate = a.value
                                }
                                if(a.key === "deposit_zero_time") {
                                    depositZeroTime = a.value
                                }
                                if(a.key === "remaining_deposit") {
                                    remainingDeposit = a.value
                                }
                            }
                        }
                    }
                }
                success(newFlowRate, depositZeroTime, remainingDeposit);
                toast.success('Update flow rate successful');
            }
        } catch (e) {
            error();
            console.error(e);
            toast.error('Update flow rate failed');
        } finally {
            setIsUpdatingFlowRate(false);
        }
    }

    return { isUpdatingFlowRate, onUpdateFlowRate }
}
