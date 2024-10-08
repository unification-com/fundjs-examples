import { useChain } from "@cosmos-kit/react";
import {
  BasicModal,
  Box,
  Button,
  Link,
  Spinner,
  Stack,
  Tabs,
  Text,
  TextField,
  toast,
  useColorModeValue,
} from "@interchain-ui/react";
import {useModal, usePaymentStreamData, useQueryAccountInfo, useQueryBalance} from "@/hooks";
import {calculateFlowRate, exponentiate, getExplorer, getExponent} from "@/utils";
import { Stream } from "@/components/streams/Stream";
import { useEffect, useState } from "react";
import { useCreateStream } from "@/hooks/useCreateStream";
import { Stream as StreamType } from "@unification-com/fundjs-react/mainchain/stream/v1/stream";
import { WalletStatus } from "@cosmos-kit/core";

export type StreamsProps = {
  chainName: string;
};

interface Item {
  key: string;
  label: string;
  index: number;
}

export function StreamList({ chainName }: StreamsProps) {
  const { address, status: walletStatus } = useChain(chainName);
  const {
    data: streamData,
    isLoading: isLoadingStreamData,
    refetch: refetchStreamData,
  } = usePaymentStreamData(chainName);
  const {
    data: balanceData,
    isLoading: isLoadingBalanceData,
    refetch: refetchBalanceData,
  } = useQueryBalance(chainName, "nund");

  const [isCalculated, setIsCalculated] = useState(false);

  const { onCreateStream } = useCreateStream(chainName);
  const {
    modal: statusModal,
    open: openStatusModal,
    close: closeStatusModal,
  } = useModal("");
  const [modalContent, setModalContent] = useState(<></>);
  const [currentAddress, setCurrentAddress] = useState<string>("");
  const [currentBalance, setCurrentBalance] = useState<any>(null);
  const [currentChainName, setCurrentChainName] = useState(chainName);
  const [initStreamFormData, setInitStreamFormData] = useState({
    fund: "100",
    period: "6",
    duration: "1",
    receiver: "",
  });

  const [newStreamFormData, setNewStreamFormData] = useState({
    receiver: "",
    deposit: 0,
    flowRate: 0,
    depositEndTime: 0,
    receiverAmount: 0,
    validatorAmount: 0,
  });

  const exponent = getExponent(chainName);
  const explorer = getExplorer(chainName);

  const {data: accountInfo, setQueryData: setAccInfoQuery, isLoading: isAccInfoLoading, refetch: refetchAccInfo} = useQueryAccountInfo(chainName, "")

  // refetch data when wallet address changes - only if not data is currently loading
  useEffect(() => {
    if (
      address &&
      chainName &&
      chainName !== currentChainName &&
      address !== currentAddress &&
      walletStatus === WalletStatus.Connected &&
      !isLoadingStreamData &&
      !isLoadingBalanceData
    ) {
      setCurrentAddress(address);
      setCurrentChainName(chainName);
      refetchStreamData();
      refetchBalanceData();
    }

    if (address && !isLoadingBalanceData) {
      // refresh balance every 6 seconds.
      // ToDo - use websockets and listen for message.receiver=address
      const interval = setInterval(() => {
        refetchBalanceData();
      }, 6000);
      return () => {
        clearInterval(interval);
      };
    }
  }, [
    walletStatus,
    address,
    isLoadingStreamData,
    isLoadingBalanceData,
    balanceData,
    chainName,
  ]);

  useEffect(() => {
    if (
      balanceData &&
      balanceData.balance !== undefined &&
      parseInt(balanceData?.balance?.amount, 10) !==
        parseInt(currentBalance?.balance?.amount, 10)
    ) {
      setCurrentBalance(balanceData);
    }
  }, [balanceData]);

  function handleClickRefreshButton(e: { preventDefault: () => void }) {
    e.preventDefault();
    refetchStreamData();
    refetchBalanceData();
  }

  function handleCreateNewStreamSubmit(e: { preventDefault: () => void }) {
    e.preventDefault();
    setModalContent(
      <Text fontSize="$lg">
        <Spinner size="$5xl" /> Sending transaction
      </Text>
    );
    openStatusModal();
    const nund = exponentiate(newStreamFormData.deposit, exponent);

    if (nund > parseInt(currentBalance.balance.amount, 10)) {
      onCreateNewStreamError("Cannot deposit more than balance");
      return;
    }

    onCreateStream({
      receiver: newStreamFormData.receiver,
      deposit: nund,
      flowRate: newStreamFormData.flowRate,
      success: onCreateNewStreamSuccess,
      error: onCreateNewStreamError,
    });
  }

  function handleInitNewStreamSubmit(e: { preventDefault: () => void }) {
    e.preventDefault();
    if (initStreamFormData.receiver === "") {
      toast.error("Receiver wallet address required");
      return;
    }

    // convert FUND to nund
    const nund = exponentiate(initStreamFormData.fund, exponent);

    // calculate flow rate
    const fr = calculateFlowRate(nund, initStreamFormData.period, initStreamFormData.duration)

    const d = { ...newStreamFormData };
    d.receiver = initStreamFormData.receiver;
    d.deposit = initStreamFormData.fund as any;
    d.flowRate = fr;
    d.depositEndTime = calculateDepositEndTime(
        initStreamFormData.fund,
        fr
    );

    const vf = parseFloat(streamData.params.validatorFee);
    const validatorAmount = (initStreamFormData.fund as any) * vf;
    d.validatorAmount = validatorAmount;
    d.receiverAmount = (initStreamFormData.fund as any) - validatorAmount;
    setNewStreamFormData(d);
    setIsCalculated(true);

    // query receiver wallet account to see if it exists
    setAccInfoQuery(initStreamFormData.receiver)
    refetchAccInfo()
  }

  function handleInitNewStreamInputChange(e: {
    target: { id: any; value: any;};
  }) {
    const { id, value } = e.target;
    setInitStreamFormData({ ...initStreamFormData, [id]: value });
  }

  function calculateDepositEndTime(
    deposit: string | number | undefined,
    flowRate: number
  ) {
    const now = Math.floor(Date.now() / 1000);
    const nund = exponentiate(deposit, exponent);
    const timeLeft = Math.round(nund / flowRate);
    return now + timeLeft;
  }

  function handleCreateNewStreamInputChange(e: {
    target: { name: any; value: any };
  }) {
    const { name, value } = e.target;
    if (name === "deposit") {
      const vf = parseFloat(streamData.params.validatorFee);
      const validatorAmount = value * vf;
      const receiverAmount = value - validatorAmount;

      const depositEndTime = calculateDepositEndTime(
        value,
        newStreamFormData.flowRate
      );
      setNewStreamFormData({
        ...newStreamFormData,
        [name]: value,
        depositEndTime,
        validatorAmount,
        receiverAmount,
      });
    } else {
      setNewStreamFormData({ ...newStreamFormData, [name]: value });
    }
  }

  function resetFormData() {
    setInitStreamFormData({
      fund: "100",
      period: "6",
      duration: "1",
      receiver: "",
    });

    setNewStreamFormData({
      receiver: "",
      deposit: 0,
      flowRate: 0,
      depositEndTime: 0,
      receiverAmount: 0,
      validatorAmount: 0,
    });

    setIsCalculated(false);
  }

  function onCreateNewStreamSuccess(txHash: string | undefined) {
    resetFormData();
    let output = <>{txHash}</>;
    if (explorer.tx_page !== undefined && txHash != null) {
      const url = explorer.tx_page.replace("${txHash}", txHash);
      output = (
        <Link href={url} target={"_blank"}>
          {txHash}
        </Link>
      );
    }
    setModalContent(
      <>
        <Text fontSize="$lg">Stream created successfully in tx:</Text>
        <Text fontSize="$lg">{output}</Text>
      </>
    );
    refetchStreamData();
    refetchBalanceData();
  }

  function onCreateNewStreamError(errMsg: string) {
    setModalContent(
      <>
        <Text fontSize="$lg" fontWeight={"$bold"}>
          Error creating stream:
        </Text>
        <Text fontSize="$lg">{errMsg}</Text>
      </>
    );
  }

  const Loading = (
    <Box p="$8" borderRadius="$md" justifyContent="center" display={"flex"}>
      <Spinner
        size="$5xl"
        color={useColorModeValue("$blackAlpha800", "$whiteAlpha900")}
      />
    </Box>
  );

  const asSenderStreams = (
    <>
      <Box mt="$10">
        <Stack direction="horizontal" space="$6">
          <Text fontSize={"$xl"} fontWeight={"$bold"}>
            Streams as Sender
          </Text>
          <Button
            intent="tertiary"
            size={"sm"}
            onClick={handleClickRefreshButton}
          >
            Refresh
          </Button>
        </Stack>
      </Box>
      <Box display={"block"} alignItems={"center"} width={"100%"}>
        {streamData.streamsAsSender?.streams?.length > 0 ? (
          streamData.streamsAsSender?.streams?.map(
            (
              streamRes: {
                sender: string;
                receiver: string;
                stream: StreamType;
              },
              index: any
            ) => (
              <Stream
                key={`${index}_${streamRes.sender}_${streamRes.receiver}`}
                chainName={chainName}
                sender={streamRes.sender}
                receiver={streamRes.receiver}
                stream={streamRes.stream}
                validatorFeePerc={parseFloat(streamData?.params?.validatorFee)}
                walletBalance={parseInt(currentBalance?.balance?.amount, 10)}
                refetchStreams={refetchStreamData}
                refetchBalanceData={refetchBalanceData}
              />
            )
          )
        ) : (
          <Text fontSize={"&lg"} fontWeight={"$bold"}>
            No streams
          </Text>
        )}
      </Box>
    </>
  );

  const asReceiverStreams = (
    <>
      <Box mt="$10">
        <Stack direction="horizontal" space="$6">
          <Text fontSize={"$xl"} fontWeight={"$bold"}>
            Streams as Receiver
          </Text>
          <Button
            intent="tertiary"
            size={"sm"}
            onClick={handleClickRefreshButton}
          >
            Refresh
          </Button>
        </Stack>
      </Box>
      <Box display={"block"} alignItems={"center"} width={"100%"}>
        {streamData.streamsAsReceiver?.streams?.length > 0 ? (
          streamData.streamsAsReceiver?.streams?.map(
            (
              streamRes: {
                sender: string;
                receiver: string;
                stream: StreamType;
              },
              index: any
            ) => (
              <Stream
                key={`${index}_${streamRes.sender}_${streamRes.receiver}`}
                chainName={chainName}
                sender={streamRes.sender}
                receiver={streamRes.receiver}
                stream={streamRes.stream}
                validatorFeePerc={parseFloat(streamData?.params?.validatorFee)}
                walletBalance={parseInt(currentBalance?.balance?.amount, 10)}
                refetchStreams={refetchStreamData}
                refetchBalanceData={refetchBalanceData}
              />
            )
          )
        ) : (
          <Text>No streams</Text>
        )}
      </Box>
    </>
  );

  const textColor = useColorModeValue("#000", "#fff");
  const bgColor = useColorModeValue("#fff", "#0F172A");
  const createNewStreamContent = (
    <Box
      display={"flex"}
      alignItems={"center"}
      justifyContent={"start"}
      width={"100%"}
      mt="$8"
    >
      <Box
        mt="$8"
        width={isCalculated ? "100%" : "100%"}
        display="table"
        justifyContent={"center"}
        borderRadius="$lg"
        // backgroundColor={useColorModeValue("#F5F7FB", "#0F172A")}
        backgroundColor="$cardBg"
        px="$4"
        py="$4"
      >
        <Box mt="$8" display="table-row">
          <Box mt="$4" display="table-cell">
            <form
              onSubmit={handleInitNewStreamSubmit}
              className={"payment-stream-form"}
            >
              <Box mb="$8">
                <Text fontSize="$lg" fontWeight="$bold">
                  1. Calculate Flow Rate
                </Text>
              </Box>
              <Box
                display="flex"
                justifyContent="space-between"
                gap="20px"
                flexWrap={"wrap"}
              >
                <Box
                  display={"flex"}
                  justifyContent={"start"}
                  alignItems={"start"}
                  gap={!isCalculated ? "20px" : ""}
                  flexDirection={isCalculated ? "column" : "row"}
                  flexWrap={"wrap"}
                >
                  <Box mb="$1">
                    <TextField
                      id="fund"
                      type="text"
                      name="fund"
                      value={initStreamFormData.fund}
                      onChange={handleInitNewStreamInputChange}
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
                        value={initStreamFormData.duration || "1"}
                        onChange={handleInitNewStreamInputChange}
                        label="Every"
                        inputClassName="inputBox"
                        placeholder="Enter Duration"
                      />
                    </Box>
                    <Box mt="$11">
                      <select
                          id="period"
                          value={initStreamFormData.period}
                          onChange={handleInitNewStreamInputChange}
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
                          Minute{initStreamFormData.duration > "1" ? "s" : null}
                        </option>
                        <option value="3">
                          Hour{initStreamFormData.duration > "1" ? "s" : null}
                        </option>
                        <option value="4">
                          Day{initStreamFormData.duration > "1" ? "s" : null}
                        </option>
                        <option value="5">
                          Week{initStreamFormData.duration > "1" ? "s" : null}
                        </option>
                        <option value="6">
                          Month{initStreamFormData.duration > "1" ? "s" : null}
                        </option>
                        <option value="7">
                          Year{initStreamFormData.duration > "1" ? "s" : null}
                        </option>
                      </select>
                    </Box>
                  </Box>
                </Box>

                <Box mb="$3" flexGrow={1}>
                  <TextField
                      id="receiver"
                      type="text"
                      size="sm"
                      name="receiver"
                      value={initStreamFormData.receiver}
                      onChange={handleInitNewStreamInputChange}
                      label="Receiver Wallet Address"
                      placeholder="Enter wallet address"
                  />
                </Box>
              </Box>

              <Box
                  mb="$1"
                  mt="$10"
                  display={"flex"}
                  alignItems={"center"}
                  justifyContent={"end"}
                  width={isCalculated ? "223px" : ""}
              >
                <Button variant="solid" intent="success">
                  Calculate
                </Button>
              </Box>
            </form>
          </Box>
          <Box mt="$8" display={!isCalculated ? "none" : "table-cell"}>
            {!isCalculated ? null : (
                <form
                    onSubmit={handleCreateNewStreamSubmit}
                    className={"payment-stream-form"}
                    style={{
                      border: "1px solid #979797",
                      borderRadius: "6px",
                }}
              >
                <Text fontSize="$lg" fontWeight="$bold">
                  2. Verify the following, then click Create
                </Text>
                <Text fontSize="$md">
                  <strong>Receiver:</strong> {
                  isAccInfoLoading ? <Spinner /> : newStreamFormData.receiver
                }
                </Text>
                  {
                    !isAccInfoLoading && accountInfo?.error !== null ? (
                        <Box
                            backgroundColor="#fac9ff"
                            p="$2"
                            borderRadius={"$md"}
                            mb="$3"
                            mt={"$3"}
                        >
                          <Text fontSize="$md" color={"#000"}>{
                            accountInfo?.error.message.includes("NotFound") ? "Receiver wallet does not currently exist. Send FUND to it" : accountInfo?.error.message
                          }</Text>
                        </Box>
                    ) : <></>
                  }
                <Text fontSize="$md">
                  <strong>Deposit:</strong>{" "}
                  <input
                    type="text"
                    size={5}
                    name="deposit"
                    value={newStreamFormData.deposit}
                    onChange={handleCreateNewStreamInputChange}
                    style={{
                      padding: "5px",
                      marginLeft: "10px",
                      borderRadius: "4px",
                      border: "1px solid #ccc",
                      width: "100px",
                      color: textColor,
                      backgroundColor: bgColor,
                    }}
                  />{" "}
                  FUND
                </Text>
                <Text fontSize="$md">
                  <strong>Flow Rate:</strong> {newStreamFormData.flowRate}{" "}
                  nund/sec (
                  {exponentiate(
                    newStreamFormData.flowRate?.toString(),
                    -exponent
                  ).toFixed(9)}{" "}
                  FUND/sec)
                </Text>
                <Text fontSize="$md">
                  <strong>Deposit End:</strong>{" "}
                  {new Date(
                    newStreamFormData.depositEndTime * 1000
                  ).toLocaleString("en-GB")}
                </Text>

                {streamData?.params && (
                  <Text fontSize="$sm">
                    <Box
                      backgroundColor="#fac9ff"
                      p="$2"
                      color={"#000"}
                      borderRadius={"$md"}
                      mb="$3"
                      mt={"$3"}
                    >
                      <strong>Note:</strong> A{" "}
                      {parseFloat(streamData?.params?.validatorFee) * 100}%
                      Validator fee will automatically be deducted each time a
                      claim is made.
                    </Box>
                    Receiver Amount:{" "}
                    {new Intl.NumberFormat("en-GB").format(
                      newStreamFormData.receiverAmount
                    )}{" "}
                    FUND
                    <br />
                    Validator Fee:{" "}
                    {new Intl.NumberFormat("en-GB").format(
                      newStreamFormData.validatorAmount
                    )}{" "}
                    FUND
                  </Text>
                )}
                <input
                  type="hidden"
                  name="receiver"
                  value={newStreamFormData.receiver}
                />
                <input
                  type="hidden"
                  name="flowRate"
                  value={newStreamFormData.flowRate}
                />
                <Box mt="$5" display={"flex"} justifyContent={"end"}>
                  <Button variant="outlined" intent="secondary">
                    Create
                  </Button>
                  <button
                    onClick={resetFormData}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "4px",
                      backgroundColor: "#f44336",
                      color: "white",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                </Box>
              </form>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );

  const connect = (
    <Box mt="$8" display="flex" alignItems="center" justifyContent="center">
      <Text fontSize="$lg">
        Please connect to your wallet to see the streams.
      </Text>
    </Box>
  );

  const content = (
    <Tabs
      tabs={[
        {
          content: createNewStreamContent,
          label: "Create Stream",
        },
        {
          content: asSenderStreams,
          label: `As Sender (${
            isLoadingStreamData
              ? 0
              : streamData.streamsAsSender?.pagination?.total
          })`,
        },
        {
          content: asReceiverStreams,
          label: `As Receiver (${
            isLoadingStreamData
              ? 0
              : streamData.streamsAsReceiver?.pagination?.total
          })`,
        },
      ]}
    />
  );

  const faucet = (
    <Box mb="$8" display="flex" alignItems="center">
      <Text fontSize="$md">
        <strong>
          Get TestNet FUND from the{" "}
          <Link
            href={"https://faucet-testnet.unification.io"}
            target={"_blank"}
            underline={true}
          >
            Faucet
          </Link>
        </strong>
      </Text>
    </Box>
  );

  return (
    <Box mb="$10" position="relative">
      {chainName === "unificationtestnet" ? faucet : null}
      {/* <Box mb="$8">{address ? balance : null}</Box> */}
      {address ? content : connect}
      <BasicModal
        title={
          <Box maxWidth="40rem">
            <Text fontSize="$xl" fontWeight="$bold">
              Create Stream
            </Text>
          </Box>
        }
        isOpen={statusModal.open}
        onOpen={openStatusModal}
        onClose={closeStatusModal}
      >
        <Box position="relative" maxWidth={"$containerSm"}>
          {modalContent}
        </Box>
      </BasicModal>
    </Box>
  );
}
