import { useState } from 'react';
import { mainchain } from '@unification-com/fundjs-react';
import { toast } from '@interchain-ui/react';
import { useChain } from '@cosmos-kit/react';
import { coins, StdFee, coin, parseCoins, Coin } from '@cosmjs/stargate';
import { useTx } from '@/hooks';
import { getCoin } from '@/utils';

const MessageComposer = mainchain.stream.v1.MessageComposer;

export type onCancelStreamOptions = {
    receiver: string;
    success?: (txHash: string | undefined) => void
    error?: (errMsg: string) => void
}

export function useCancelSteam(chainName: string) {
    const { tx } = useTx(chainName);
    const { address } = useChain(chainName);
    const [isCanellingStream, setIsCanellingStream] = useState(false);

    const chainCoin = getCoin(chainName);

    async function onCancelStream({ receiver,  success = (txHash: string | undefined) => { }, error = (errMsg: string) => { } }: onCancelStreamOptions) {
        if (!address) return;

        const msg = MessageComposer.withTypeUrl.cancelStream({
            receiver,
            sender: address,
        });

        const fee: StdFee = {
            amount: coins('1000', chainCoin.base),
            gas: '1000000',
        };

        try {
            setIsCanellingStream(true);
            const res = await tx([msg], { fee });
            if (res.error) {
                error(res.errorMsg);
                console.error(res.error);
                toast.error(res.errorMsg);
            } else {
                const txHash = res?.response?.transactionHash
                success(txHash);
                toast.success('Cancel Stream successful');
            }
        } catch (e) {
            // @ts-ignore
            error(e.error);
            console.error(e);
            toast.error('Cancel Stream failed');
        } finally {
            setIsCanellingStream(false);
        }
    }

    return { isCanellingStream, onCancelStream }
}
