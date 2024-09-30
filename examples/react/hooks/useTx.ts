import { cosmos } from "@unification-com/fundjs-react";
import { useChain } from "@cosmos-kit/react";
import {
  DeliverTxResponse,
  isDeliverTxSuccess,
  StdFee,
} from "@cosmjs/stargate";

export type Msg = {
  typeUrl: string;
  value: { [key: string]: any };
};

export type TxOptions = {
  fee?: StdFee;
};

export class TxError extends Error {
  constructor(message: string = "Transaction Error", options?: ErrorOptions) {
    super(message, options);
    this.name = "TxError";
  }
}

export class TxResult {
  error?: TxError;
  response?: DeliverTxResponse;

  constructor({ error, response }: Pick<TxResult, "error" | "response">) {
    this.error = error;
    this.response = response;
  }

  get errorMsg() {
    if (this.isOutOfGas) {
      return `Out of gas. Gas Wanted: ${this.response?.gasWanted}, Gas Used: ${this.response?.gasUsed}`;
    }
    return this.error?.message || "Transaction Failed";
  }

  get isSuccess() {
    return this.response && isDeliverTxSuccess(this.response);
  }

  get isOutOfGas() {
    return this.response && this.response.gasUsed > this.response.gasWanted;
  }
}

export function useTx(chainName: string) {
  const { address, getSigningStargateClient, estimateFee } =
    useChain(chainName);

  async function tx(msgs: Msg[], options: TxOptions = {}) {
    if (!address) {
      return new TxResult({ error: new TxError("Wallet not connected") });
    }

    try {
      const fee = await estimateFee(msgs, undefined, undefined, 2.0);
      const client = await getSigningStargateClient();

      if (!client)
        return new TxResult({ error: new TxError("Invalid Stargate client") });

      const signed = await client.sign(address, msgs, fee, "");
      if (!signed)
        return new TxResult({ error: new TxError("Invalid transaction") });

      const response = await client.broadcastTx(
        Uint8Array.from(cosmos.tx.v1beta1.TxRaw.encode(signed).finish())
      );

      return isDeliverTxSuccess(response)
        ? new TxResult({ response })
        : new TxResult({ response, error: new TxError(response.rawLog) });
    } catch (error: any) {
      return new TxResult({
        error: new TxError(error.message || "Transaction Error"),
      });
    }
  }

  return { tx };
}
