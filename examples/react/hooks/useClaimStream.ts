import { useState } from "react";
import { mainchain } from "@unification-com/fundjs-react";
import { toast } from "@interchain-ui/react";
import { useChain } from "@cosmos-kit/react";
import { coins, StdFee, parseCoins, Coin } from "@cosmjs/stargate";
import { useTx } from "@/hooks";
import { getCoin } from "@/utils";

const MessageComposer = mainchain.stream.v1.MessageComposer;

export type ClaimStreamOptions = {
  sender: string;
  success?: (remaining: Coin, txHash: string | undefined) => void;
  error?: (errMsg: string) => void;
};

export function useClaimStream(chainName: string) {
  const { tx } = useTx(chainName);
  const { address } = useChain(chainName);
  const [isClaiming, setIsClaiming] = useState(false);
  const chainCoin = getCoin(chainName);

  async function onClaimStream({
    sender,
    success = () => {},
    error = () => {},
  }: ClaimStreamOptions) {
    if (!address) {
      error("Address not available");
      return;
    }

    const msg = MessageComposer.withTypeUrl.claimStream({
      sender,
      receiver: address,
    });

    const fee: StdFee = {
      amount: coins("1000", chainCoin.base),
      gas: "1000000",
    };

    try {
      setIsClaiming(true);
      const res = await tx([msg], { fee });

      if (res.error) {
        const errMsg = res.errorMsg || "Transaction failed";
        error(errMsg);
        console.error(errMsg);
        toast.error(errMsg);
        return;
      }

      let remaining = parseCoins("0nund")[0];

      res.response?.events?.forEach((event) => {
        if (event.type === "claim_stream") {
          event.attributes.forEach((attribute) => {
            if (attribute.key === "remaining_deposit") {
              remaining = parseCoins(attribute.value)[0];
            }
          });
        }
      });

      const txHash = res.response?.transactionHash;
      success(remaining, txHash);
      toast.success("Claim Stream successful");
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : "Claim Stream failed";
      error(errMsg);
      console.error(e);
      toast.error(errMsg);
    } finally {
      setIsClaiming(false);
    }
  }

  return { isClaiming, onClaimStream };
}
