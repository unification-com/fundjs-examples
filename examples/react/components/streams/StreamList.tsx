import {useChain} from "@cosmos-kit/react";
import {
    BasicModal,
    Box,
    Button,
    Link,
    Spinner,
    Stack,
    Tabs,
    Text,
    toast,
    useColorModeValue,
} from "@interchain-ui/react";
import {useModal, usePaymentStreamData, useQueryBalance} from "@/hooks";
import {exponentiate, getCoin, getExplorer, getExponent} from "@/utils";
import {Stream} from "@/components/streams/Stream";
import {useCalculateFlowRate} from "@/hooks/useCalculateFlowRate";
import {useEffect, useState} from "react";
import {useCreateStream} from "@/hooks/useCreateStream";
import {Stream as StreamType} from "@unification-com/fundjs-react/mainchain/stream/v1/stream";
import {WalletStatus} from "@cosmos-kit/core";

export type StreamsProps = {
    chainName: string;
};

export function StreamList({chainName}: StreamsProps) {
    const {address, status: walletStatus} = useChain(chainName);
    const {data: streamData, isLoading: isLoadingStreamData, refetch: refetchStreamData} = usePaymentStreamData(chainName);
    const {data: balanceData, isLoading: isLoadingBalanceData, refetch: refetchBalanceData} = useQueryBalance(chainName, "nund");
    const {onCalculateFlowRate} = useCalculateFlowRate(chainName);
    const {onCreateStream} = useCreateStream(chainName)
    const [isCalculated, setIsCalculated] = useState(false)
    const { modal: statusModal, open: openStatusModal, close: closeStatusModal } = useModal("");
    const [ modalContent, setModalContent ] = useState(<></>)
    const [currentAddress, setCurrentAddress] = useState<string>("")
    const [currentBalance, setCurrentBalance] = useState<any>(null)

    const [initStreamFormData, setInitStreamFormData] = useState({
        fund: 100,
        period: 6,
        duration: 1,
        receiver: '',
    });

    const [newStreamFormData, setNewStreamFormData] = useState({
        receiver: '',
        deposit: 0,
        flowRate: 0,
        depositEndTime: 0,
        receiverAmount: 0,
        validatorAmount: 0,
    })

    const exponent = getExponent(chainName);
    const explorer = getExplorer(chainName)

    // refetch data when wallet address changes - only if not data is currently loading
    useEffect(() => {
        if (
            address
            && address !== currentAddress
            && walletStatus === WalletStatus.Connected
            && !isLoadingStreamData
            && !isLoadingBalanceData
        ) {
            setCurrentAddress(address);
            refetchStreamData()
            refetchBalanceData()
        }

        if(
            address
            && !isLoadingBalanceData
        ) {
            // refresh balance every 6 seconds.
            // ToDo - use websockets and listen for message.receiver=address
            const interval = setInterval(() => {
                refetchBalanceData()
            }, 6000);
            return () => {
                clearInterval(interval);
            };
        }

    }, [walletStatus, address, isLoadingStreamData, isLoadingBalanceData, balanceData]);

    useEffect(() => {
        if (
            balanceData
            && parseInt(balanceData?.balance?.amount, 10 ) > 0
            && parseInt(balanceData?.balance?.amount, 10 ) !== parseInt(currentBalance?.balance?.amount, 10 )
        ) {
            setCurrentBalance(balanceData)
        }

    }, [balanceData]);

    function handleClickRefreshButton(e: { preventDefault: () => void; }) {
        e.preventDefault();
        refetchStreamData()
        refetchBalanceData()
    }

    function handleCreateNewStreamSubmit(e: { preventDefault: () => void; }) {
        e.preventDefault();
        setModalContent(<Text fontSize="$lg">
            <Spinner
                size="$5xl"
            /> Sending transaction
        </Text>)
        openStatusModal();
        const nund = exponentiate(newStreamFormData.deposit, exponent)

        if(nund > parseInt(currentBalance.balance.amount, 10)) {
            onCreateNewStreamError("Cannot deposit more than balance")
            return
        }

        onCreateStream({
            receiver: newStreamFormData.receiver,
            deposit: nund,
            flowRate: newStreamFormData.flowRate,
            success: onCreateNewStreamSuccess,
            error: onCreateNewStreamError,
        })
    }

    function handleInitNewStreamSubmit(e: { preventDefault: () => void; }) {
        e.preventDefault();
        if (initStreamFormData.receiver === "") {
            toast.error('Receiver wallet address required');
            return
        }
        // convert FUND to nund
        const nund = exponentiate(initStreamFormData.fund, exponent)
        const nundCoin = `${nund}nund`

        onCalculateFlowRate({
            coin: nundCoin,
            period: initStreamFormData.period,
            duration: initStreamFormData.duration,
            success: onCalculateFlowRateSuccess,
        })
    }

    function handleInitNewStreamInputChange(e: { target: { name: any; value: any; }; }) {
        const {name, value} = e.target;
        setInitStreamFormData({...initStreamFormData, [name]: value});
    }

    function calculateDepositEndTime(deposit: string | number | undefined, flowRate: number) {
        const now = Math.floor(Date.now() / 1000)
        const nund = exponentiate(deposit, exponent)
        const timeLeft = Math.round(nund / flowRate)
        return now + timeLeft
    }

    function handleCreateNewStreamInputChange(e: { target: { name: any; value: any; }; }) {
        const {name, value} = e.target;
        if (name === "deposit") {
            const vf = parseFloat(streamData.params.validatorFee)
            const validatorAmount = value * vf
            const receiverAmount = value - validatorAmount

            const depositEndTime = calculateDepositEndTime(value, newStreamFormData.flowRate);
            setNewStreamFormData({...newStreamFormData, [name]: value, depositEndTime, validatorAmount, receiverAmount});
        } else {
            setNewStreamFormData({...newStreamFormData, [name]: value});
        }

    }

    function onCalculateFlowRateSuccess(flowRate: string) {
        const d = {...newStreamFormData}
        d.receiver = initStreamFormData.receiver
        d.deposit = initStreamFormData.fund
        d.flowRate = parseInt(flowRate)
        d.depositEndTime = calculateDepositEndTime(initStreamFormData.fund, parseInt(flowRate))

        const vf = parseFloat(streamData.params.validatorFee)
        const validatorAmount = initStreamFormData.fund * vf
        d.validatorAmount = validatorAmount
        d.receiverAmount = initStreamFormData.fund - validatorAmount
        setNewStreamFormData(d);
        setIsCalculated(true)
    }

    function resetFormData() {
        setInitStreamFormData({
            fund: 100,
            period: 6,
            duration: 1,
            receiver: '',
        })

        setNewStreamFormData({
            receiver: '',
            deposit: 0,
            flowRate: 0,
            depositEndTime: 0,
            receiverAmount: 0,
            validatorAmount: 0,
        })

        setIsCalculated(false)
    }

    function onCreateNewStreamSuccess(txHash: string | undefined) {
        resetFormData()
        let output = <>{txHash}</>
        if(explorer.tx_page !== undefined && txHash != null) {
            const url = explorer.tx_page.replace("${txHash}", txHash)
            output = <Link href={url} target={"_blank"}>{txHash}</Link>
        }
        setModalContent(
            <>
                <Text fontSize="$lg">
                    Stream created successfully in tx:
                </Text>
                <Text fontSize="$lg">
                    {output}
                </Text>
            </>
        )
        refetchStreamData()
        refetchBalanceData()
    }

    function onCreateNewStreamError(errMsg: string) {

        setModalContent(
            <>
                <Text fontSize="$lg" fontWeight={"$bold"}>
                    Error creating stream:
                </Text>
                <Text fontSize="$lg">
                    {errMsg}
                </Text>
            </>
        )
    }
    const Loading = (
        <Box
            p="$8"
            borderRadius="$md"
            justifyContent="center"
            display={"flex"}
        >
            <Spinner
                size="$5xl"
                color={useColorModeValue("$blackAlpha800", "$whiteAlpha900")}
            />
        </Box>
    );

    const asSenderStreams = (
        <>
            <Stack
                direction="horizontal"
                space="$6"
            >
                <Text fontSize={"$xl"} fontWeight={"$bold"}>
                    Streams as Sender
                </Text>
                <Button intent="tertiary" size={"sm"} onClick={handleClickRefreshButton}>Refresh</Button>
            </Stack>
            <Box display={"block"} alignItems={"center"} width={"100%"}>
                {streamData.streamsAsSender?.streams?.length > 0 ? streamData.streamsAsSender?.streams?.map((streamRes: {
                sender: string;
                receiver: string;
                stream: StreamType;
            }, index: any) => (
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
            )) : <Text fontSize={"&lg"} fontWeight={"$bold"}>No streams</Text>}
            </Box>
        </>
    )

    const asReceiverStreams = (
        <>
            <Stack
                direction="horizontal"
                space="$6"
            >
                <Text fontSize={"$xl"} fontWeight={"$bold"}>
                    Streams as Receiver
                </Text>
                <Button intent="tertiary" size={"sm"} onClick={handleClickRefreshButton}>Refresh</Button>
            </Stack>
            <Box display={"block"} alignItems={"center"} width={"100%"}>
            {streamData.streamsAsReceiver?.streams?.length > 0 ? streamData.streamsAsReceiver?.streams?.map((streamRes: { sender: string; receiver: string; stream: StreamType; }, index: any) => (
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
            )) : <Text>No streams</Text> }
            </Box>
        </>
    )

    // @ts-ignore
    const balance = (

        <>
            <Text fontSize="$lg" fontWeight={"$bold"} textAlign={"center"}>
                Balance: {
                parseInt(currentBalance?.balance?.amount, 10 ) > 0 ?
                new Intl.NumberFormat('en-GB').format( exponentiate(currentBalance?.balance?.amount, -exponent))
                    : 0
            } FUND
            </Text>
        </>

    )

    const createNewStreamContent = (
        <Box mt="$8" width="100%" display="table" justifyContent={"centre"} borderRadius="$lg" backgroundColor="$cardBg" px="$4" py="$4">
            <Box mt="$8" display="table-row">
                <Box mt="$8" display="table-cell">
                    <form onSubmit={handleInitNewStreamSubmit} className={"payment-stream-form"}>

                        <Text fontSize="$lg" fontWeight="$bold">
                            1. Calculate Flow Rate
                        </Text>
                        <Text>
                            Send:
                            <input type="text" size={5} name="fund" value={initStreamFormData.fund}
                                   onChange={handleInitNewStreamInputChange}/> FUND
                        </Text>
                        <Text>
                            Every
                            <input type="text" size={1} name="duration" value={initStreamFormData.duration}
                                   onChange={handleInitNewStreamInputChange}/>

                            <select value={initStreamFormData.period} onChange={handleInitNewStreamInputChange}
                                    name="period">
                                <option value="2">Minute{initStreamFormData.duration > 1 ? 's' : null}</option>
                                <option value="3">Hour{initStreamFormData.duration > 1 ? 's' : null}</option>
                                <option value="4">Day{initStreamFormData.duration > 1 ? 's' : null}</option>
                                <option value="5">Week{initStreamFormData.duration > 1 ? 's' : null}</option>
                                <option value="6">Month{initStreamFormData.duration > 1 ? 's' : null}</option>
                                <option value="7">Year{initStreamFormData.duration > 1 ? 's' : null}</option>
                            </select>
                        </Text>
                        <Text>
                            To:
                            <input type="text" name="receiver" value={initStreamFormData.receiver}
                                   placeholder={"enter wallet address"}
                                   onChange={handleInitNewStreamInputChange}/>
                        </Text>
                        <br/>
                        <button type="submit">Calculate</button>
                    </form>
                </Box>
                <Box mt="$8" display="table-cell">
                    {
                        !isCalculated ? null : (

                            <form onSubmit={handleCreateNewStreamSubmit} className={"payment-stream-form"}>
                                <Text fontSize="$lg" fontWeight="$bold">
                                    2. Verify the following, then click Create
                                </Text>
                                <Text fontSize="$lg">
                                    <strong>Receiver:</strong> {newStreamFormData.receiver}
                                </Text>
                                <Text fontSize="$lg">
                                    <strong>Deposit:</strong> <input type="text" size={5} name="deposit"
                                                    value={newStreamFormData.deposit}
                                                    onChange={handleCreateNewStreamInputChange}/> FUND
                                </Text>
                                <Text fontSize="$lg">
                                    <strong>Flow Rate:</strong> {newStreamFormData.flowRate} nund/sec
                                    ({exponentiate(newStreamFormData.flowRate?.toString(), -exponent).toFixed(9)} FUND/sec)
                                </Text>
                                <Text fontSize="$lg">
                                    <strong>Deposit End:</strong> {new Date(newStreamFormData.depositEndTime * 1000).toLocaleString()}
                                </Text>

                                <br />

                                {streamData?.params && <Text fontSize="$sm">
                                    <strong>Note:</strong> A {parseFloat(streamData?.params?.validatorFee) * 100}%
                                    Validator fee will
                                    automatically be deducted each time a claim is made.<br/>

                                    Receiver
                                    Amount: {new Intl.NumberFormat('en-GB').format(newStreamFormData.receiverAmount)} FUND<br/>
                                    Validator
                                    Fee: {new Intl.NumberFormat('en-GB').format(newStreamFormData.validatorAmount)} FUND
                                </Text>}

                                <input type="hidden" name="receiver" value={newStreamFormData.receiver}/>

                                <input type="hidden" name="flowRate" value={newStreamFormData.flowRate}/>
                                <button type="submit">Create</button>
                                &nbsp;
                                <button onClick={resetFormData}>Cancel</button>
                            </form>)
                    }
                </Box>
            </Box>
        </Box>
    )

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
                    label: 'Create Stream'
                },
                {
                    content: asSenderStreams,
                    label: `As Sender (${isLoadingStreamData ? 0 : streamData.streamsAsSender?.pagination?.total})`
                },
                {
                    content: asReceiverStreams,
                    label: `As Receiver (${isLoadingStreamData ? 0 : streamData.streamsAsReceiver?.pagination?.total})`
                }
            ]}
        />
    );

    const faucet = (
        <Box mb="$8" display="flex" alignItems="center" justifyContent="center">
            <Text fontSize="$lg">
                <strong>
                    Get TestNet FUND from the <Link href={"https://faucet-testnet.unification.io"} target={"_blank"} underline={true}>Faucet</Link>
                </strong>
            </Text>
        </Box>
    )

    return (
        <Box mb="$20" position="relative">
            {chainName === 'unificationtestnet' ? faucet : null}

            {address ? balance : null }

            {address ? content : connect}

            <BasicModal
                title={
                    <Box maxWidth="40rem">
                        <Text fontSize="$xl" fontWeight="$bold">Create Stream</Text>
                    </Box>
                }
                isOpen={statusModal.open}
                onOpen={openStatusModal}
                onClose={closeStatusModal}
            >

                <Box position="relative" maxWidth={"$containerSm"}>
                    { modalContent }
                </Box>

            </BasicModal>

        </Box>
    );
}
