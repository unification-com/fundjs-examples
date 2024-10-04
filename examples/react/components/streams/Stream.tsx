import {
  BasicModal,
  Box,
  Button,
  Link,
  Select,
  SelectOption,
  Spinner,
  Stack,
  Text,
  TextField,
  useColorModeValue,
} from "@interchain-ui/react";

import { Stream as IStream } from "@unification-com/fundjs-react/mainchain/stream/v1/stream";
import {calculateFlowRate, exponentiate, getCoin, getExplorer, getExponent} from "@/utils";
import { useEffect, useState } from "react";
import { useChain } from "@cosmos-kit/react";
import { useClaimStream } from "@/hooks/useClaimStream";
import { coin, Coin, parseCoins } from "@cosmjs/stargate";
import {useModal, useTx} from "@/hooks";
import { useTopUpDeposit } from "@/hooks/useTopupDeposit";
import { useCalculateFlowRate } from "@/hooks/useCalculateFlowRate";
import { useUpdateFlowRate } from "@/hooks/useUpdateFlowRate";
import { useCancelSteam } from "@/hooks/useCancelStream";
import {useQueryStreamTxs} from "@/hooks/useQueryStreamTxs";
import {TxHistory} from "@/components/streams/TxHistory";
import {TxResponse} from "cosmjs-types/cosmos/base/abci/v1beta1/abci";

export type StreamProps = {
  stream: IStream;
  sender: string;
  receiver: string;
  chainName: string;
  validatorFeePerc: number;
  walletBalance: number;
  refetchStreams?: () => void;
  refetchBalanceData?: () => void;
};

interface Item {
  key: string;
  label: string;
  index: number;
}

export function Stream({
  stream,
  sender,
  receiver,
  chainName,
  validatorFeePerc,
  walletBalance,
  refetchStreams = () => {},
  refetchBalanceData = () => {},
}: StreamProps) {
  const { address } = useChain(chainName);
  const [claimable, setClaimable] = useState(0);
  const [actualReceive, setActualReceive] = useState(0);
  const [validatorFee, setValidatorFee] = useState(0);
  const [remainingDeposit, setRemainingDeposit] = useState(0);
  const [isSender, setIsSender] = useState(address === sender);
  const [showTopUpInfo, setShowTopUpInfo] = useState(false);
  const { onClaimStream } = useClaimStream(chainName);
  const { onTopUpDeposit } = useTopUpDeposit(chainName);

  const { onUpdateFlowRate } = useUpdateFlowRate(chainName);
  const { onCancelStream } = useCancelSteam(chainName);
  const [streamData, setStreamData] = useState(stream);



  const {
    modal: topupDepositModal,
    open: openTopupDepositModal,
    close: closeTopupDepositModal,
  } = useModal("");
  const {
    modal: updateFlowRateModal,
    open: openUpdateFlowRateModal,
    close: closeUpdateFlowRateModal,
  } = useModal("");
  const {
    modal: sendUpdateFlowRateModal,
    open: openSendUpdateFlowRateModal,
    close: closeSendUpdateFlowRateModal,
  } = useModal("");
  const {
    modal: cancelStreamModal,
    open: openCancelStreamModal,
    close: closeCancelStreamModal,
  } = useModal("");
  const {
    modal: statusModal,
    open: openStatusModal,
    close: closeStatusModal,
  } = useModal("");
  const [modalContent, setModalContent] = useState(<></>);

  const [topUpFormData, setTopUpFormData] = useState({
    deposit: "100",
    deposotZeroTime: 0,
  });

  const [updateFlowFormData, setUpdateFlowFormData] = useState({
    fund: "100",
    period: "6",
    duration: "1",
    flowRate: 0,
  });

  const explorer = getExplorer(chainName);
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const timeSince = now - streamData.lastOutflowTime.getTime();
      const flowMs = parseInt(streamData.flowRate.toString(), 10) / 1000;
      let claimable = flowMs * timeSince;
      const remainingDeposit = parseInt(
        streamData.deposit.amount.toString(),
        10
      );
      if (claimable > remainingDeposit) {
        claimable = remainingDeposit;
      }
      const remaining = remainingDeposit - claimable;
      const valFee = claimable * validatorFeePerc;

      setShowTopUpInfo(false);
      if (now > streamData.depositZeroTime.getTime() && claimable > 0) {
        setShowTopUpInfo(true);
      }

      setClaimable(claimable);
      setValidatorFee(valFee);
      setActualReceive(claimable - valFee);
      setRemainingDeposit(remaining > 0 ? remaining : 0);
    }, 100);
    return () => {
      clearInterval(interval);
    };
  }, [streamData, validatorFeePerc]);

  function handleClaimSubmit(e: { preventDefault: () => void }) {
    e.preventDefault();
    setModalContent(
      <>
        <Text fontSize="$lg" fontWeight={"$bold"}>
          Approx. Total Claim: {exponentiate(claimable, -exponent).toFixed(9)}{" "}
          {chainCoin.symbol}
        </Text>

        <Box
          backgroundColor="#fac9ff"
          color={"#000"}
          p="$2"
          fontSize="$sm"
          borderRadius={"$md"}
          mb="$3"
          mt={"$3"}
        >
          Note - actual amount is calculated on-chain at the block time the
          transaction is processed
        </Box>

        <Text fontSize="$lg">
          <strong style={{ marginRight: "20px" }}>
            You will receive approx.:
          </strong>{" "}
          {exponentiate(actualReceive, -exponent).toFixed(3)} {chainCoin.symbol}
        </Text>
        <Box mb="$3" mt={"$3"}>
          <Text fontSize="$lg">
            <strong style={{ marginRight: "10px" }}>
              {validatorFeePerc * 100}% Validator Fee approx.:
            </strong>{" "}
            {exponentiate(validatorFee, -exponent).toFixed(3)}{" "}
            {chainCoin.symbol}
          </Text>
        </Box>
        <Text fontSize="$lg">
          <Spinner size="$5xl" /> Sending transaction
        </Text>
      </>
    );
    openStatusModal();
    onClaimStream({
      sender,
      success: onClaimStreamSuccess,
      error: onSendTxError,
    });
  }

  function handleTxHistoryClick(e: { preventDefault: () => void }) {
    e.preventDefault();
    setModalContent(
        <TxHistory chainName={chainName} sender={sender} receiver={receiver} />
    )
    openStatusModal()
  }

  function handleOnCloseStatusModal() {
    closeStatusModal();
    refetchStreams();
    refetchBalanceData();
  }

  function onClaimStreamSuccess(remaining: Coin, txHash: string | undefined) {
    setStreamData({
      ...streamData,
      lastOutflowTime: new Date(),
      deposit: remaining,
    });

    let explorerUrl = <>{txHash}</>;
    if (explorer.tx_page !== undefined && txHash != null) {
      const url = explorer.tx_page.replace("${txHash}", txHash);
      explorerUrl = (
        <Link href={url} target={"_blank"}>
          {txHash}
        </Link>
      );
    }

    setModalContent(
      <Text fontSize="$lg">
        Claim successful
        <br />
        {explorerUrl}
      </Text>
    );
  }

  function onSendTxError(errMsg: string) {
    setModalContent(
      <>
        <Text fontSize="$lg" fontWeight={"$bold"}>
          Error:
        </Text>
        <Text fontSize="$lg">{errMsg}</Text>
      </>
    );
  }

  function handleTopupDepositInputChange(e: {
    target: { id: any; value: any };
  }) {
    const { id, value } = e.target;
    setTopUpFormData({ ...topUpFormData, [id]: value });
  }

  function handleTopupDepositSubmit(e: { preventDefault: () => void }) {
    e.preventDefault();
    setModalContent(
      <Text fontSize="$lg">
        <Spinner size="$5xl" /> Sending transaction
      </Text>
    );
    openStatusModal();
    closeTopupDepositModal();
    const nund = exponentiate(topUpFormData.deposit, exponent);

    if (nund > walletBalance) {
      onSendTxError("Cannot deposit more than balance");
      return;
    }

    onTopUpDeposit({
      receiver,
      deposit: nund,
      success: onTopUpDepositSuccess,
      error: onSendTxError,
    });
  }

  function onTopUpDepositSuccess(
    depositZeroTime: string,
    txHash: string | undefined
  ) {
    const nund = exponentiate(topUpFormData.deposit, exponent);
    const newDeposit = coin(
      parseInt(streamData.deposit.amount, 10) + nund,
      "nund"
    );
    setStreamData({
      ...streamData,
      deposit: newDeposit,
      depositZeroTime: new Date(depositZeroTime),
    });

    let explorerUrl = <>{txHash}</>;
    if (explorer.tx_page !== undefined && txHash != null) {
      const url = explorer.tx_page.replace("${txHash}", txHash);
      explorerUrl = (
        <Link href={url} target={"_blank"}>
          {txHash}
        </Link>
      );
    }

    setModalContent(
      <Text fontSize="$lg">
        Top Up successful
        <br />
        {explorerUrl}
      </Text>
    );
  }

  function handleUpdateFlowRateInputChange(e: {
    target: { id: any; value: any; };
  }) {
    const { id, value } = e.target;
    setUpdateFlowFormData({ ...updateFlowFormData, [id]: value });
  }

  function handleUpdateFlowRateSubmit(e: { preventDefault: () => void }) {
    e.preventDefault();

    // convert FUND to nund
    const nund = exponentiate(updateFlowFormData.fund, exponent);

    // calculate flow rate
    const fr = calculateFlowRate(nund, updateFlowFormData.period, updateFlowFormData.duration)

    setUpdateFlowFormData({
      ...updateFlowFormData,
      flowRate: fr,
    });

    closeUpdateFlowRateModal();
    openSendUpdateFlowRateModal();
  }

  function handleSendUpdateFlowRateSubmit(e: { preventDefault: () => void }) {
    e.preventDefault();
    setModalContent(
      <Text fontSize="$lg">
        <Spinner size="$5xl" /> Sending transaction
      </Text>
    );
    openStatusModal();
    closeSendUpdateFlowRateModal();

    onUpdateFlowRate({
      receiver,
      flowRate: updateFlowFormData.flowRate,
      success: onSendUpdateFlowRateSuccess,
      error: onSendTxError,
    });
  }

  function onSendUpdateFlowRateSuccess(
    newFlowRate: string,
    depositZeroTime: string,
    remainingDeposit: string,
    txHash: string | undefined
  ) {
    const parsedCoins = parseCoins(remainingDeposit);
    setStreamData({
      ...streamData,
      flowRate: BigInt(newFlowRate),
      depositZeroTime: new Date(depositZeroTime),
      deposit: parsedCoins[0],
      lastOutflowTime: new Date(),
    });

    let explorerUrl = <>{txHash}</>;
    if (explorer.tx_page !== undefined && txHash != null) {
      const url = explorer.tx_page.replace("${txHash}", txHash);
      explorerUrl = (
        <Link href={url} target={"_blank"}>
          {txHash}
        </Link>
      );
    }

    setModalContent(
      <Text fontSize="$lg">
        Update flow rate successful
        <br />
        {explorerUrl}
      </Text>
    );
  }

  function onCancelStreamSuccess(txHash: string | undefined) {
    setStreamData({
      ...streamData,
      flowRate: BigInt(0),
      depositZeroTime: new Date(Date.now()),
      deposit: coin(0, "nund"),
      lastOutflowTime: new Date(Date.now()),
    });

    let explorerUrl = <>{txHash}</>;
    if (explorer.tx_page !== undefined && txHash != null) {
      const url = explorer.tx_page.replace("${txHash}", txHash);
      explorerUrl = (
        <Link href={url} target={"_blank"}>
          {txHash}
        </Link>
      );
    }

    setModalContent(
      <Text fontSize="$lg">
        Cancel stream successful <br />
        {explorerUrl}
      </Text>
    );
  }

  function handleCancelStreamSubmit(e: { preventDefault: () => void }) {
    e.preventDefault();
    setModalContent(
      <Text fontSize="$lg">
        <Spinner size="$5xl" /> Sending transaction
      </Text>
    );
    openStatusModal();
    closeCancelStreamModal();

    onCancelStream({
      receiver,
      success: onCancelStreamSuccess,
      error: onSendTxError,
    });
  }

  const chainCoin = getCoin(chainName);
  const exponent = getExponent(chainName);

  const txHistory = (
      <Button
          intent="primary"
          size={"sm"}
          onClick={handleTxHistoryClick}
          className="claim-btm"
      >
        Tx History
      </Button>
  )

  const claim = (
      <Stack direction="vertical" space="$6">
        {txHistory}
        <Button
            intent="primary"
            size={"sm"}
            onClick={handleClaimSubmit}
            className="claim-btm"
        >
          Claim
        </Button>
      </Stack>
  );

  const editButtons = (
    <Stack direction="vertical" space="$6">
      {txHistory}
      <Button intent="tertiary" size={"sm"} onClick={openTopupDepositModal}>
        Top Up Deposit
      </Button>
      <Button intent="tertiary" size={"sm"} onClick={openUpdateFlowRateModal}>
        Update Flow Rate
      </Button>
      <Button intent="danger" size={"sm"} onClick={openCancelStreamModal}>
        Cancel Stream
      </Button>
    </Stack>
  );

  const accExplorerLink = isSender ? (
    explorer.account_page ? (
      <Link
        href={explorer.account_page.replace("${accountAddress}", receiver)}
        target={"_blank"}
      >
        {receiver}
      </Link>
    ) : (
      receiver
    )
  ) : explorer.account_page ? (
    <Link
      href={explorer.account_page.replace("${accountAddress}", sender)}
      target={"_blank"}
    >
      {sender}
    </Link>
  ) : (
    sender
  );

  return (
    <Box
      mt="$8"
      width="100%"
      display="table"
      borderRadius="$lg"
      // backgroundColor={useColorModeValue("#F5F7FB", "#0F172A")}
      backgroundColor="$cardBg"
      px="$10"
      py="$8"
    >
      <Box mt="$8" display="table-row">
        <Box mt="$8" display="table-cell">
          <Box mt="$8" display="table-row">
            <Box display="table-cell" width="200px" paddingBottom="8px">
              <Text fontSize="$sm" fontWeight="$bold">
                {isSender ? "To" : "From"}:
              </Text>
            </Box>
            <Box mt="$8" display="table-cell">
              <Text fontSize="$sm" fontWeight="$bold">
                {accExplorerLink}
              </Text>
            </Box>
          </Box>
          <Box mt="$8" display="table-row">
            <Box mt="$8" display="table-cell" paddingBottom="8px">
              <Text fontSize="$sm" fontWeight="$bold">
                Flow Rate:
              </Text>
            </Box>
            <Box mt="$8" display="table-cell">
              <Text fontSize="$sm" fontWeight="$bold">
                {exponentiate(
                  streamData.flowRate?.toString(),
                  -exponent
                ).toFixed(9)}{" "}
                {chainCoin.symbol} / sec
              </Text>
            </Box>
          </Box>
          <Box mt="$8" display="table-row">
            <Box mt="$8" display="table-cell" paddingBottom="8px">
              <Text fontSize="$sm" fontWeight="$bold">
                Deposit:
              </Text>
            </Box>
            <Box mt="$8" display="table-cell">
              <Text fontSize="$sm" fontWeight="$bold">
                {exponentiate(
                  streamData.deposit.amount.toString(),
                  -exponent
                ).toFixed(9)}{" "}
                {chainCoin.symbol}
              </Text>
            </Box>
          </Box>
          <Box mt="$8" display="table-row">
            <Box mt="$8" display="table-cell" paddingBottom="8px">
              <Text fontSize="$sm" fontWeight="$bold">
                Deposit Zero Time:
              </Text>
            </Box>
            <Box mt="$8" display="table-cell">
              <Text fontSize="$sm" fontWeight="$bold">
                {streamData.depositZeroTime.toLocaleString("en-GB")}
              </Text>
            </Box>
          </Box>
          <Box mt="$8" display="table-row">
            <Box mt="$8" display="table-cell" paddingBottom="8px">
              <Text fontSize="$sm" fontWeight="$bold">
                Last Claim Time:
              </Text>
            </Box>
            <Box mt="$8" display="table-cell">
              <Text fontSize="$sm" fontWeight="$bold">
                {streamData.lastOutflowTime.toLocaleString("en-GB")}
              </Text>
            </Box>
          </Box>
          <Box mt="$8" display="table-row">
            <Box mt="$8" display="table-cell">
              <Text fontSize="$sm" fontWeight="$bold">
                Claimable:
              </Text>
            </Box>
            <Box mt="$8" display="table-cell">
              <Text fontSize="$sm" fontWeight="$bold">
                {exponentiate(claimable, -exponent).toFixed(9)}{" "}
                {chainCoin.symbol}
              </Text>
            </Box>
          </Box>
        </Box>

        <Box
          mt="$8"
          pr="$5"
          display="table-cell"
          verticalAlign={isSender ? "middle" : "bottom"}
          width={isSender ? "130px" : "130px"}
        >
          <Box mt="$8" display="table-cell">
            {isSender ? editButtons : claim}
          </Box>
        </Box>
      </Box>
      <Box mt="$8" display="table-row">
        <Box mt="$8" display="table-cell"></Box>
      </Box>

      <BasicModal
        title={
          <Box maxWidth="40rem">
            <Text fontSize="$xl" fontWeight="$bold">
              Top Up Deposit
            </Text>
          </Box>
        }
        isOpen={topupDepositModal.open}
        onOpen={openTopupDepositModal}
        onClose={closeTopupDepositModal}
      >
        <form
          onSubmit={handleTopupDepositSubmit}
          className={"payment-stream-form"}
        >
          <Box mb="$1">
            <TextField
              id="deposit"
              type="text"
              name="deposit"
              value={topUpFormData.deposit}
              onChange={handleTopupDepositInputChange}
              label="Enter the fund amount to top up"
              placeholder="Fund Amount"
            />
          </Box>
          {/* <Text>
            Deposit:
            <input
              type="text"
              name="deposit"
              size={3}
              value={topUpFormData.deposit}
              onChange={handleTopupDepositInputChange}
            />{" "}
            {chainCoin.symbol}
          </Text> */}
          {showTopUpInfo ? (
            <Box position="relative" maxWidth={"$containerSm"}>
              <Text fontSize="$sm">
                Note: the &quot;deposit zero time&quot; has passed. Any
                remaining unclaimed funds will
                <br />
                be automatically forwarded to the receiver wallet as part of
                this Top Up transaction.
              </Text>
            </Box>
          ) : null}
          <Box
            mt="$4"
            mb="$1"
            display={"flex"}
            alignItems={"center"}
            justifyContent={"end"}
          >
            <Button size={"sm"} intent="tertiary">
              Top Up
            </Button>
          </Box>
        </form>
      </BasicModal>

      <BasicModal
        title={
          <Box maxWidth="40rem">
            <Text fontSize="$xl" fontWeight="$bold">
              Update Flow Rate
            </Text>
          </Box>
        }
        isOpen={updateFlowRateModal.open}
        onOpen={openUpdateFlowRateModal}
        onClose={closeUpdateFlowRateModal}
      >
        <form
          onSubmit={handleUpdateFlowRateSubmit}
          className={"payment-stream-form"}
        >
          <Box mb="$1">
            <TextField
              id="fund"
              type="text"
              name="fund"
              value={updateFlowFormData.fund}
              onChange={handleUpdateFlowRateInputChange}
              label="Fund Amount"
              placeholder="Enter Fund Amount"
            />
          </Box>
          <Box
            display={"flex"}
            alignItems={"center"}
            justifyContent={"start"}
            gap={"4px"}
          >
            <Box mb="$1">
              <TextField
                id="duration"
                type="text"
                name="duration"
                value={updateFlowFormData.duration || "1"}
                onChange={handleUpdateFlowRateInputChange}
                label="Every"
                inputClassName="inputBox"
                placeholder="Enter Duration"
              />
            </Box>
            <Box mt="$11">
              <select
                id="period"
                value={updateFlowFormData.period}
                onChange={handleUpdateFlowRateInputChange}
                name="period"
                style={{
                  background: useColorModeValue("#fff", "#0F172A"),
                  color: useColorModeValue("#0F172A", "#fff"),
                  width: "100px",
                  height: "40px",
                }}
                defaultValue={"2"}
              >
                <option value="2">
                  Minute{updateFlowFormData.duration > "1" ? "s" : null}
                </option>
                <option value="3">
                  Hour{updateFlowFormData.duration > "1" ? "s" : null}
                </option>
                <option value="4">
                  Day{updateFlowFormData.duration > "1" ? "s" : null}
                </option>
                <option value="5">
                  Week{updateFlowFormData.duration > "1" ? "s" : null}
                </option>
                <option value="6">
                  Month{updateFlowFormData.duration > "1" ? "s" : null}
                </option>
                <option value="7">
                  Year{updateFlowFormData.duration > "1" ? "s" : null}
                </option>
              </select>
            </Box>
          </Box>
          <Box
            mb="$1"
            mt="$4"
            display={"flex"}
            alignItems={"center"}
            justifyContent={"end"}
          >
            <Button size={"sm"} intent="tertiary">
              Calculate
            </Button>
          </Box>
        </form>
      </BasicModal>

      <BasicModal
        title={
          <Box maxWidth="40rem">
            <Text fontSize="$xl" fontWeight="$bold">
              Send New Flow Rate
            </Text>
          </Box>
        }
        isOpen={sendUpdateFlowRateModal.open}
        onOpen={openSendUpdateFlowRateModal}
        onClose={closeSendUpdateFlowRateModal}
      >
        <form
          onSubmit={handleSendUpdateFlowRateSubmit}
          className={"payment-stream-form"}
        >
          <Text color="$textSecondary" fontSize="$sm" fontWeight="$semibold">
            Updating the flow rate will also result in approx.{" "}
            {exponentiate(claimable, -exponent).toFixed(3)} {chainCoin.symbol}{" "}
            being sent to the receiver before the new flow rate is applied.
          </Text>
          <br />
          <Text>
            <strong>New Flow Rate:</strong> {updateFlowFormData.flowRate}{" "}
            nund/sec (
            {exponentiate(updateFlowFormData.flowRate, -exponent).toFixed(9)}{" "}
            {chainCoin.symbol} / sec)
            <input
              type="hidden"
              name="flowRate"
              value={updateFlowFormData.flowRate}
            />{" "}
            FUND
          </Text>
          <Box
            mb="$1"
            display={"flex"}
            alignItems={"center"}
            justifyContent={"end"}
          >
            <Button variant="outlined" size={"sm"}>
              Send
            </Button>
          </Box>
        </form>
      </BasicModal>

      <BasicModal
        title={
          <Box maxWidth="40rem">
            <Text fontSize="$xl" fontWeight="$bold">
              Cancel Stream
            </Text>
          </Box>
        }
        isOpen={cancelStreamModal.open}
        onOpen={openCancelStreamModal}
        onClose={closeCancelStreamModal}
      >
        <form
          onSubmit={handleCancelStreamSubmit}
          className={"payment-stream-form"}
        >
          <Text color="$textSecondary" fontSize="$sm" fontWeight="$semibold">
            Cancelling the stream result in approx.{" "}
            {exponentiate(claimable, -exponent).toFixed(3)} {chainCoin.symbol}{" "}
            being sent to the receiver.
            <br />
            You will be refunded approx.{" "}
            {exponentiate(remainingDeposit, -exponent).toFixed(3)}{" "}
            {chainCoin.symbol}
          </Text>
          <Box
            mb="$1"
            display={"flex"}
            alignItems={"center"}
            justifyContent={"end"}
          >
            <Button size={"sm"}>Cancel Stream</Button>
          </Box>
        </form>
      </BasicModal>

      <BasicModal
        title={
          <Box maxWidth="40rem">
            <Text fontSize="$xl" fontWeight="$bold"></Text>
          </Box>
        }
        isOpen={statusModal.open}
        onOpen={openStatusModal}
        onClose={handleOnCloseStatusModal}
      >
        <Box position="relative" maxWidth={"$containerSm"}>
          {modalContent}
        </Box>
      </BasicModal>
    </Box>
  );
}
