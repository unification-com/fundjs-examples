import { useState } from 'react';
import { mainchain } from '@unification-com/fundjs-react';
import { toast } from '@interchain-ui/react';
import { useChain } from '@cosmos-kit/react';
import { coins, StdFee, coin, parseCoins, Coin } from '@cosmjs/stargate';
import { useTx } from '@/hooks';
import { getCoin } from '@/utils';

const MessageComposer = mainchain.stream.v1.MessageComposer;

export type onClaimStreamOptions = {
    sender: string;
    success?: (remaining: Coin) => void
    error?: () => void
}

export function useClaimStream(chainName: string) {
    const { tx } = useTx(chainName);
    const { address } = useChain(chainName);
    const [isClaiming, setIsClaiming] = useState(false);

    const chainCoin = getCoin(chainName);

    async function onClaimStream({ sender, success = (remaining) => { }, error = () => { } }: onClaimStreamOptions) {
        if (!address) return;

        const msg = MessageComposer.withTypeUrl.claimStream({
            sender,
            receiver: address,
        });

        const fee: StdFee = {
            amount: coins('1000', chainCoin.base),
            gas: '1000000',
        };

        try {
            setIsClaiming(true);
            const res = await tx([msg], { fee });
            if (res.error) {
                error();
                console.error(res.error);
                toast.error(res.errorMsg);
            } else {
                const remainingCoins = parseCoins("0nund")
                let remaining = remainingCoins[0]
                if(res.response?.events) {
                    for(let i = 0; i < res.response?.events.length; i += 1) {
                        const e = res.response?.events[i]
                        if(e?.type === "claim_stream") {
                            for(let j = 0; j < e.attributes.length; j += 1) {
                                const a = e.attributes[j]
                                if(a.key === "remaining_deposit") {
                                    const c = parseCoins(a.value)
                                    remaining = c[0]
                                }
                            }
                        }
                    }
                }
                success(remaining);
                toast.success('Claim Stream successful');
            }
        } catch (e) {
            error();
            console.error(e);
            toast.error('Claim Stream failed');
        } finally {
            setIsClaiming(false);
        }
    }

    return { isClaiming, onClaimStream }
}
