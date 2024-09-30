import { useState } from "react";
import { mainchain } from "@unification-com/fundjs-react";
import { toast } from "@interchain-ui/react";
import { useChain } from "@cosmos-kit/react";
import { coins, StdFee } from "@cosmjs/stargate";
import { useTx } from "@/hooks";
import { getCoin } from "@/utils";

const MessageComposer = mainchain.stream.v1.MessageComposer;

export type onCancelStreamOptions = {
  receiver: string;
  success?: (txHash: string | undefined) => void;
  error?: (errMsg: string) => void;
};

export function useCancelSteam(chainName: string) {
  const { tx } = useTx(chainName);
  const { address } = useChain(chainName);
  const [isCanellingStream, setIsCanellingStream] = useState(false);

  const chainCoin = getCoin(chainName);

  async function onCancelStream({
    receiver,
    success = (txHash: string | undefined) => {},
    error = (errMsg: string) => {},
  }: onCancelStreamOptions) {
    if (!address) {
      error("Address not available");
      return;
    }

    const msg = MessageComposer.withTypeUrl.cancelStream({
      receiver,
      sender: address,
    });

    const fee: StdFee = {
      amount: coins("1000", chainCoin.base),
      gas: "1000000",
    };

    try {
      setIsCanellingStream(true);
      const res = await tx([msg], { fee });

      if (res.error) {
        throw new Error(res.errorMsg);
      }

      const txHash = res?.response?.transactionHash;
      success(txHash);
      toast.success("Cancel Stream successful");
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : "Cancel Stream failed";
      error(errMsg);
      console.error(e);
      toast.error(errMsg);
    } finally {
      setIsCanellingStream(false);
    }
  }

  return { isCanellingStream, onCancelStream };
}
