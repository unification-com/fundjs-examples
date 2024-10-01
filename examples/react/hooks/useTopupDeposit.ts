import { useState } from "react";
import { mainchain } from "@unification-com/fundjs-react";
import { toast } from "@interchain-ui/react";
import { useChain } from "@cosmos-kit/react";
import { coins, StdFee, coin } from "@cosmjs/stargate";
import { useTx } from "@/hooks";
import { getCoin } from "@/utils";

const MessageComposer = mainchain.stream.v1.MessageComposer;

export type TopUpDepositOptions = {
  receiver: string;
  deposit: number;
  success?: (depositZeroTime: string, txHash: string | undefined) => void;
  error?: (errMsg: string) => void;
};

export function useTopUpDeposit(chainName: string) {
  const { tx } = useTx(chainName);
  const { address } = useChain(chainName);
  const [isToppingUp, setIsToppingUp] = useState(false);
  const chainCoin = getCoin(chainName);

  const onTopUpDeposit = async ({
    receiver,
    deposit,
    success = () => {},
    error = () => {},
  }: TopUpDepositOptions) => {
    if (!address) return;

    const msg = MessageComposer.withTypeUrl.topUpDeposit({
      receiver,
      sender: address,
      deposit: coin(deposit, chainCoin.base),
    });

    const fee: StdFee = {
      amount: coins("1000", chainCoin.base),
      gas: "1000000",
    };

    setIsToppingUp(true);
    try {
      const res = await tx([msg], { fee });
      handleResponse(res, success, error);
    } catch (e) {
      handleError(e, error);
    } finally {
      setIsToppingUp(false);
    }
  };

  const handleResponse = (
    res: any,
    success: TopUpDepositOptions["success"],
    error: TopUpDepositOptions["error"]
  ) => {
    if (res.error) {
      if (error) {
        error(res.errorMsg);
      }
      console.error(res.error);
      toast.error(res.errorMsg);
      return;
    }

    const depositZeroTime = extractDepositZeroTime(res.response?.events);
    const txHash = res.response?.transactionHash;
    if (success) {
      success(depositZeroTime, txHash);
    }
    toast.success("Top up deposit successful");
  };

  const extractDepositZeroTime = (events: any[]) => {
    if (!events) return "";

    for (const event of events) {
      if (event?.type === "stream_deposit") {
        for (const attribute of event.attributes) {
          if (attribute.key === "deposit_zero_time") {
            return attribute.value;
          }
        }
      }
    }
    return "";
  };

  const handleError = (
    error: any,
    errorCallback: TopUpDepositOptions["error"]
  ) => {
    // @ts-ignore
    errorCallback(error?.error);
    console.error(error);
    toast.error("Top up deposit failed");
  };

  return { isToppingUp, onTopUpDeposit };
}
