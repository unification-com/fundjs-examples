import { useState } from 'react';
import { mainchain } from '@unification-com/fundjs-react';
import { toast } from '@interchain-ui/react';
import { useChain } from '@cosmos-kit/react';
import { coins, StdFee, coin, parseCoins, Coin } from '@cosmjs/stargate';
import { useTx } from '@/hooks';
import { getCoin } from '@/utils';

const MessageComposer = mainchain.stream.v1.MessageComposer;

export type onTopUpDepositOptions = {
    receiver: string;
    deposit: number;
    success?: (depositZeroTime: string) => void
    error?: () => void
}

export function useTopUpDeposit(chainName: string) {
    const { tx } = useTx(chainName);
    const { address } = useChain(chainName);
    const [isToppingUp, setIsToppingUp] = useState(false);

    const chainCoin = getCoin(chainName);

    async function onTopUpDeposit({ receiver, deposit, success = (depositZeroTime) => { }, error = () => { } }: onTopUpDepositOptions) {
        if (!address) return;

        const msg = MessageComposer.withTypeUrl.topUpDeposit({
            receiver,
            sender: address,
            deposit: coin(deposit, chainCoin.base),
        });

        const fee: StdFee = {
            amount: coins('1000', chainCoin.base),
            gas: '1000000',
        };

        try {
            setIsToppingUp(true);
            const res = await tx([msg], { fee });
            if (res.error) {
                error();
                console.error(res.error);
                toast.error(res.errorMsg);
            } else {
                let depositZeroTime = '';
                if(res.response?.events) {
                    for(let i = 0; i < res.response?.events.length; i += 1) {
                        const e = res.response?.events[i]
                        if(e?.type === "stream_deposit") {
                            for(let j = 0; j < e.attributes.length; j += 1) {
                                const a = e.attributes[j]
                                if(a.key === "deposit_zero_time") {
                                    depositZeroTime = a.value
                                }
                            }
                        }
                    }
                }
                success(depositZeroTime);
                toast.success('Top up deposit successful');
            }
        } catch (e) {
            error();
            console.error(e);
            toast.error('Top up deposit failed');
        } finally {
            setIsToppingUp(false);
        }
    }

    return { isToppingUp, onTopUpDeposit }
}
