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
    success?: () => void
    error?: () => void
}

export function useCancelSteam(chainName: string) {
    const { tx } = useTx(chainName);
    const { address } = useChain(chainName);
    const [isCanellingStream, setIsCanellingStream] = useState(false);

    const chainCoin = getCoin(chainName);

    async function onCancelStream({ receiver,  success = () => { }, error = () => { } }: onCancelStreamOptions) {
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
                error();
                console.error(res.error);
                toast.error(res.errorMsg);
            } else {
                success();
                toast.success('Cancel Stream successful');
            }
        } catch (e) {
            error();
            console.error(e);
            toast.error('Cancel Stream failed');
        } finally {
            setIsCanellingStream(false);
        }
    }

    return { isCanellingStream, onCancelStream }
}
