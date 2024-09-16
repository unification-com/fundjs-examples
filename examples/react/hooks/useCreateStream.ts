import { useState } from 'react';
import { mainchain } from '@unification-com/fundjs-react';
import { toast } from '@interchain-ui/react';
import { useChain } from '@cosmos-kit/react';
import { coins, StdFee, coin } from '@cosmjs/stargate';
import { useTx } from '@/hooks';
import { getCoin } from '@/utils';

const MessageComposer = mainchain.stream.v1.MessageComposer;

export type onCreateStreamOptions = {
    receiver: string;
    deposit: number;
    flowRate: number;
    success?: () => void
    error?: () => void
}

export function useCreateStream(chainName: string) {
    const { tx } = useTx(chainName);
    const { address } = useChain(chainName);
    const [isCreating, setIsCreating] = useState(false);

    const chainCoin = getCoin(chainName);

    async function onCreateStream({ receiver, deposit, flowRate, success = () => { }, error = () => { } }: onCreateStreamOptions) {
        if (!address) return;

        const msg = MessageComposer.withTypeUrl.createStream({
            receiver,
            sender: address,
            deposit: coin(deposit, chainCoin.base),
            flowRate: BigInt(flowRate),
        });

        const fee: StdFee = {
            amount: coins('1000', chainCoin.base),
            gas: '1000000',
        };

        try {
            setIsCreating(true);
            const res = await tx([msg], { fee });
            if (res.error) {
                error();
                console.error(res.error);
                toast.error(res.errorMsg);
            } else {
                success();
                toast.success('Create Stream successful');
            }
        } catch (e) {
            error();
            console.error(e);
            toast.error('Create Stream failed');
        } finally {
            setIsCreating(false);
        }
    }

    return { isCreating, onCreateStream }
}
