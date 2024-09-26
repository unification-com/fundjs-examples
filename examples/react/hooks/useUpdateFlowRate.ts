import { useState } from "react";
import { mainchain } from "@unification-com/fundjs-react";
import { toast } from "@interchain-ui/react";
import { useChain } from "@cosmos-kit/react";
import { coins, StdFee } from "@cosmjs/stargate";
import { useTx } from "@/hooks";
import { getCoin } from "@/utils";

const MessageComposer = mainchain.stream.v1.MessageComposer;

export type OnUpdateFlowRateOptions = {
  receiver: string;
  flowRate: number;
  success?: (
    newFlowRate: string,
    depositZeroTime: string,
    remainingDeposit: string,
    txHash?: string
  ) => void;
  error?: (errMsg: string) => void;
};

export function useUpdateFlowRate(chainName: string) {
  const { tx } = useTx(chainName);
  const { address } = useChain(chainName);
  const [isUpdatingFlowRate, setIsUpdatingFlowRate] = useState(false);
  const chainCoin = getCoin(chainName);

  async function onUpdateFlowRate({
    receiver,
    flowRate,
    success = () => {},
    error = () => {},
  }: OnUpdateFlowRateOptions) {
    if (!address) return;

    const msg = MessageComposer.withTypeUrl.updateFlowRate({
      receiver,
      sender: address,
      flowRate: BigInt(flowRate),
    });

    const fee: StdFee = {
      amount: coins("1000", chainCoin.base),
      gas: "1000000",
    };

    try {
      setIsUpdatingFlowRate(true);
      const res = await tx([msg], { fee });

      if (res.error) {
        throw new Error(res.errorMsg);
      }

      const { response } = res;
      let newFlowRate = "";
      let depositZeroTime = "";
      let remainingDeposit = "";

      response?.events?.forEach((event) => {
        if (event.type === "update_flow_rate") {
          event.attributes.forEach((attribute) => {
            switch (attribute.key) {
              case "new_flow_rate":
                newFlowRate = attribute.value;
                break;
              case "deposit_zero_time":
                depositZeroTime = attribute.value;
                break;
              case "remaining_deposit":
                remainingDeposit = attribute.value;
                break;
            }
          });
        }
      });

      const txHash = response?.transactionHash;
      success(newFlowRate, depositZeroTime, remainingDeposit, txHash);
      toast.success("Update flow rate successful");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Update flow rate failed";
      error(errorMessage);
      console.error(err);
      toast.error(errorMessage);
    } finally {
      setIsUpdatingFlowRate(false);
    }
  }

  return { isUpdatingFlowRate, onUpdateFlowRate };
}
