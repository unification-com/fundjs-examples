import {useChain} from "@cosmos-kit/react";
import {
    BasicModal,
    Box, Link,
    Spinner,
    Tabs,
    Text, toast,
    useColorModeValue,
} from "@interchain-ui/react";
import {useModal, usePaymentStreamData, useQueryBalance} from "@/hooks";
import {exponentiate, getCoin, getExponent, getExplorer} from "@/utils";
import {Stream} from "@/components/streams/Stream";
import {useCalculateFlowRate} from "@/hooks/useCalculateFlowRate";
import {useEffect, useState} from "react";
import {useCreateStream} from "@/hooks/useCreateStream";
import { Stream as StreamType } from "@unification-com/fundjs-react/mainchain/stream/v1/stream";
import {CHAIN_NAME_STORAGE_KEY} from "@/components";

export type StreamsProps = {
    chainName: string;
};

export function StreamList({chainName}: StreamsProps) {
    const {address} = useChain(chainName);
    const {data: streamData, isLoading: isLoadingStreamData, refetch: refetchStreamData} = usePaymentStreamData(chainName);
    const {data: balanceData, isLoading: isLoadingBalanceData, refetch: refetchBalanceData} = useQueryBalance(chainName, "nund");

    const {isCalculating, onCalculateFlowRate} = useCalculateFlowRate(chainName);
    const {isCreating, onCreateStream} = useCreateStream(chainName)
    const [isCalculated, setIsCalculated] = useState(false)
    const { modal: statusModal, open: openStatusModal, close: closeStatusModal } = useModal("");
    const [ modalContent, setModalContent ] = useState(<></>)
    const [currentAddress, setCurrentAddress] = useState<string>("")

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
    })

    const coin = getCoin(chainName);
    const exponent = getExponent(chainName);
    const explorer = getExplorer(chainName)

    useEffect(() => {
        if (address && address !== currentAddress) {
            setCurrentAddress(address);
            refetchStreamData()
            refetchBalanceData()
        }
    }, [address]);

    function handleClickRefreshButton() {
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
        const depositZeroTime = now + timeLeft
        return depositZeroTime
    }

    function handleCreateNewStreamInputChange(e: { target: { name: any; value: any; }; }) {
        const {name, value} = e.target;
        if (name === "deposit") {
            const depositEndTime = calculateDepositEndTime(value, newStreamFormData.flowRate);
            setNewStreamFormData({...newStreamFormData, [name]: value, depositEndTime});
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
            <h2>Streams as Sender</h2>
            <button onClick={handleClickRefreshButton}>Refresh</button>
            {isLoadingStreamData ? Loading : streamData.streamsAsSender?.map((streamRes: {
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
                    refetchStreams={refetchStreamData}
                />
            ))}
        </>
    )

    const asReceiverStreams = (
        <>
            <h2>Streams as Receiver</h2>
            <button onClick={handleClickRefreshButton}>Refresh</button>
            {isLoadingStreamData ? Loading : streamData.streamsAsReceiver?.map((streamRes: { sender: string; receiver: string; stream: StreamType; }, index: any) => (
                <Stream
                    key={`${index}_${streamRes.sender}_${streamRes.receiver}`}
                    chainName={chainName}
                    sender={streamRes.sender}
                    receiver={streamRes.receiver}
                    stream={streamRes.stream}
                    refetchStreams={refetchStreamData}
                />
            ))}
        </>
    )

    // @ts-ignore
    const balance = (
        isLoadingBalanceData ? null : <Text fontSize="$lg" fontWeight={"$bold"} textAlign={"center"}>
           Balance: {new Intl.NumberFormat('en-GB').format( exponentiate(balanceData?.balance?.amount, -exponent))} FUND
        </Text>
    )

    const createNewStreamContent = (
        <Box mt="$8" width="100%" display="table" justifyContent={"centre"}>
            <Box mt="$8" display="table-row">
                <Box mt="$8" display="table-cell">
                    <form onSubmit={handleInitNewStreamSubmit} className={"payment-stream-form"}>

                        <Text fontSize="$lg" fontWeight="$bold">
                            1. Calculate Flow Rate
                        </Text>
                        <label>
                            Send:
                            <input type="text" size={5} name="fund" value={initStreamFormData.fund}
                                   onChange={handleInitNewStreamInputChange}/> FUND
                        </label>
                        <br/>
                        <label>
                            Every
                            <input type="text" size={1} name="duration" value={initStreamFormData.duration}
                                   onChange={handleInitNewStreamInputChange}/>
                        </label>

                        <select value={initStreamFormData.period} onChange={handleInitNewStreamInputChange}
                                name="period">
                            <option value="1">Second</option>
                            <option value="2">Minute</option>
                            <option value="3">Hour</option>
                            <option value="4">Day</option>
                            <option value="5">Week</option>
                            <option value="6">Month</option>
                            <option value="7">Year</option>
                        </select>

                        <br/>
                        <label>
                            To:
                            <input type="text" name="receiver" value={initStreamFormData.receiver}
                                   placeholder={"enter wallet address"}
                                   onChange={handleInitNewStreamInputChange}/>
                        </label>
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
                    label: 'As Sender'
                },
                {
                    content: asReceiverStreams,
                    label: 'As Receiver'
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
