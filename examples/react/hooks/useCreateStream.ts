import {useState} from 'react';
import {mainchain} from '@unification-com/fundjs-react';
import {toast} from '@interchain-ui/react';
import {useChain} from '@cosmos-kit/react';
import {coins, StdFee, coin} from '@cosmjs/stargate';
import {useTx} from '@/hooks';
import {getCoin, parseStreamError} from '@/utils';

const MessageComposer = mainchain.stream.v1.MessageComposer;

export type onCreateStreamOptions = {
    receiver: string;
    deposit: number;
    flowRate: number;
    success?: (txHash: string | undefined) => void
    error?: (errMsg: string) => void
}

export function useCreateStream(chainName: string) {
    const {tx} = useTx(chainName);
    const {address} = useChain(chainName);
    const [isCreating, setIsCreating] = useState(false);

    const chainCoin = getCoin(chainName);

    async function onCreateStream({
                                      receiver, deposit, flowRate, success = (txHash: string | undefined) => {
        }, error = (errMsg: string) => {
        }
                                  }: onCreateStreamOptions) {
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
            const res = await tx([msg], {fee});
            if (res.error) {
                let errMsg: string = parseStreamError(res.errorMsg);
                error(errMsg);
                console.error(res.error);
                toast.error(errMsg);
            } else {
                const txHash = res?.response?.transactionHash
                success(txHash);
                toast.success('Create Stream successful');
            }
        } catch (e) {
            console.error(e);
            toast.error('Create Stream failed');
        } finally {
            setIsCreating(false);
        }
    }

    return {isCreating, onCreateStream}
}
