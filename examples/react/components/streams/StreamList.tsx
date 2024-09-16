import {useChain} from "@cosmos-kit/react";
import {
    Box,
    Spinner,
    Tabs,
    Text, toast,
    useColorModeValue,
} from "@interchain-ui/react";
import {useModal, usePaymentStreamData} from "@/hooks";
import {exponentiate, getCoin, getExponent} from "@/utils";
import {Stream} from "@/components/streams/Stream";
import {useCalculateFlowRate} from "@/hooks/useCalculateFlowRate";
import {useState} from "react";
import {useCreateStream} from "@/hooks/useCreateStream";
import { Stream as StreamType } from "@unification-com/fundjs-react/mainchain/stream/v1/stream";

export type StreamsProps = {
    chainName: string;
};

export function StreamList({chainName}: StreamsProps) {
    const {address} = useChain(chainName);
    const {data, isLoading, refetch} = usePaymentStreamData(chainName);
    const {isCalculating, onCalculateFlowRate} = useCalculateFlowRate(chainName);
    const {isCreating, onCreateStream} = useCreateStream(chainName)
    const [isCalculated, setIsCalculated] = useState(false)

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

    function handleCreateNewStreamSubmit(e: { preventDefault: () => void; }) {
        e.preventDefault();
        const nund = exponentiate(newStreamFormData.deposit, exponent)
        onCreateStream({
            receiver: newStreamFormData.receiver,
            deposit: nund,
            flowRate: newStreamFormData.flowRate,
            success: onCreateNewStreamSuccess,
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

    function onCreateNewStreamSuccess() {
        resetFormData()
        refetch()
    }

    const Loading = (
        <Box
            p="$8"
            borderRadius="$md"
            justifyContent="center"
            display={isLoading ? "flex" : "none"}
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
            {data.streamsAsSender?.map((streamRes: { sender: string; receiver: string; stream: StreamType; }, index: any) => (
                <Stream
                    key={`${index}_${streamRes.sender}_${streamRes.receiver}`}
                    chainName={chainName}
                    sender={streamRes.sender}
                    receiver={streamRes.receiver}
                    stream={streamRes.stream}
                />
            ))}
        </>
    )

    const asReceiverStreams = (
        <>
            <h2>Streams as Receiver</h2>
            {data.streamsAsReceiver?.map((streamRes: { sender: string; receiver: string; stream: StreamType; }, index: any) => (
                <Stream
                    key={`${index}_${streamRes.sender}_${streamRes.receiver}`}
                    chainName={chainName}
                    sender={streamRes.sender}
                    receiver={streamRes.receiver}
                    stream={streamRes.stream}
                />
            ))}
        </>
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

    return (
        <Box mb="$20" position="relative">
            {address ? Loading : null}

            {address ? content : connect}

        </Box>
    );
}
