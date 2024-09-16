import {
    BasicModal,
    Box,
    Button,
    Text,
} from "@interchain-ui/react";

import {
    Stream as IStream
} from "@unification-com/fundjs-react/mainchain/stream/v1/stream";
import {exponentiate, getCoin, getExponent} from "@/utils";
import {useEffect, useState} from "react";
import {useChain} from "@cosmos-kit/react";
import {useClaimStream} from "@/hooks/useClaimStream";
import {coin, Coin, parseCoins} from '@cosmjs/stargate';
import {useModal} from "@/hooks";
import {useTopUpDeposit} from "@/hooks/useTopupDeposit";
import {useCalculateFlowRate} from "@/hooks/useCalculateFlowRate";
import {useUpdateFlowRate} from "@/hooks/useUpdateFlowRate";
import {useCancelSteam} from "@/hooks/useCancelStream";

export type StreamProps = {
    stream: IStream;
    sender: string;
    receiver: string;
    chainName: string;
};

export function Stream({
                           stream,
                           sender,
                           receiver,
                           chainName,
                       }: StreamProps) {

    const { address } = useChain(chainName);
    const [claimable, setClaimable] = useState(0);
    const [remainingDeposit, setRemainingDeposit] = useState(0);
    const [isSender, setIsSender] = useState(address === sender);
    const { onClaimStream} = useClaimStream(chainName)
    const { onTopUpDeposit } = useTopUpDeposit(chainName)
    const { isCalculating, onCalculateFlowRate } = useCalculateFlowRate(chainName);
    const { onUpdateFlowRate } = useUpdateFlowRate(chainName);
    const { onCancelStream } = useCancelSteam(chainName)
    const [streamData, setStreamData] = useState(stream);
    const { modal: topupDepositModal, open: openTopupDepositModal, close: closeTopupDepositModal } = useModal("");
    const { modal: updateFlowRateModal, open: openUpdateFlowRateModal, close: closeUpdateFlowRateModal } = useModal("");
    const { modal: sendUpdateFlowRateModal, open: openSendUpdateFlowRateModal, close: closeSendUpdateFlowRateModal } = useModal("");

    const { modal: cancelStreamModal, open: openCancelStreamModal, close: closeCancelStreamModal } = useModal("");


    const [topUpFormData, setTopUpFormData] = useState({
        deposit: 100,
        deposotZeroTime: 0,
    })

    const [updateFlowFormData, setUpdateFlowFormData] = useState({
        fund: 100,
        period: 6,
        duration: 1,
        flowRate: 0,
    })

    useEffect(() => {
        const interval = setInterval(() => {
            const timeSince = Date.now() - streamData.lastOutflowTime.getTime()
            const flowMs = parseInt(streamData.flowRate.toString(), 10) / 1000
            const claimable = flowMs * timeSince
            const remaining = parseInt(streamData.deposit.amount.toString(), 10) - claimable

            setClaimable(claimable)
            setRemainingDeposit(remaining > 0 ? remaining : 0)
        }, 100);
        return () => {
            clearInterval(interval);
        };
    }, [streamData]);

    function handleClaimSubmit(e: { preventDefault: () => void; }) {
        e.preventDefault();
        onClaimStream({
            sender,
            success: onClaimStreamSuccess,
        })
    }

    function onClaimStreamSuccess(remaining: Coin) {
        setStreamData({...streamData, lastOutflowTime: new Date(), deposit: remaining})
    }

    function handleTopupDepositInputChange(e: { target: { name: any; value: any; }; }) {
        const { name, value } = e.target;
        setTopUpFormData({ ...topUpFormData, [name]: value });
    }

    function handleTopupDepositSubmit(e: { preventDefault: () => void; }) {
        e.preventDefault();
        const nund = exponentiate(topUpFormData.deposit, exponent)
        onTopUpDeposit({
            receiver,
            deposit: nund,
            success: onTopUpDepositSuccess,
        })
        closeTopupDepositModal()
    }

    function onTopUpDepositSuccess(depositZeroTime: string) {
        const nund = exponentiate(topUpFormData.deposit, exponent)
        const newDeposit = coin(parseInt(streamData.deposit.amount, 10) + nund, "nund")
        setStreamData({...streamData, deposit: newDeposit, depositZeroTime: new Date(depositZeroTime)})
    }

    function handleUpdateFlowRateInputChange(e: { target: { name: any; value: any; }; }) {
        const { name, value } = e.target;
        setUpdateFlowFormData({ ...updateFlowFormData, [name]: value });
    }

    function handleUpdateFlowRateSubmit(e: { preventDefault: () => void; }) {
        e.preventDefault();
        const nund = exponentiate(updateFlowFormData.fund, exponent)
        const nundCoin = `${nund}nund`

        onCalculateFlowRate({
            coin: nundCoin,
            period: updateFlowFormData.period,
            duration: updateFlowFormData.duration,
            success: onCalculateFlowRateSuccess
        })
    }

    function onCalculateFlowRateSuccess(flowRate: string) {
        setUpdateFlowFormData({ ...updateFlowFormData, flowRate: parseInt(flowRate, 10) });
        closeUpdateFlowRateModal()
        openSendUpdateFlowRateModal()
    }

    function handleSendUpdateFlowRateSubmit(e: { preventDefault: () => void; }) {
        e.preventDefault();

        onUpdateFlowRate({
            receiver,
            flowRate: updateFlowFormData.flowRate,
            success: onSendUpdateFlowRateSuccess,
        })
        closeSendUpdateFlowRateModal()
    }

    function onSendUpdateFlowRateSuccess(newFlowRate: string, depositZeroTime: string, remainingDeposit: string) {
        const parsedCoins = parseCoins(remainingDeposit)
        setStreamData({
            ...streamData,
            flowRate: BigInt(newFlowRate),
            depositZeroTime: new Date(depositZeroTime),
            deposit: parsedCoins[0],
            lastOutflowTime: new Date(),
            }
        )
    }

    function onCancelStreamSuccess() {

        setStreamData({
                ...streamData,
                flowRate: BigInt(0),
                depositZeroTime: new Date(Date.now()),
                deposit: coin(0, "nund"),
                lastOutflowTime: new Date(Date.now()),
            }
        )

        closeCancelStreamModal()
    }

    function handleCancelStreamSubmit(e: { preventDefault: () => void; }) {
        e.preventDefault();


        onCancelStream({
            receiver,
            success: onCancelStreamSuccess
        })
    }

    const chainCoin = getCoin(chainName);
    const exponent = getExponent(chainName);

    const claim = (
        <form onSubmit={handleClaimSubmit}>
            <button type="submit">Claim</button>
        </form>
    )

    const editButtons = (
        <Box mt="$8" width="100%" display="flex">
            <Button intent="secondary" variant="ghost" size={"sm"} onClick={openTopupDepositModal}>
                Top Up Deposit
            </Button>
            <Button intent="secondary" variant="ghost" size={"sm"} onClick={openUpdateFlowRateModal}>
                Update Flow Rate
            </Button>
            <Button intent="secondary" variant="ghost" size={"sm"} onClick={openCancelStreamModal}>
                Cancel Stream
            </Button>
        </Box>
    )

    return (
        <Box mt="$8" width="70%" display="table">
            <Box mt="$8" display="table-row">
                <Box mt="$8" display="table-cell" width={4}>
                    <Text
                        color="$textSecondary"
                        fontSize="$sm"
                        fontWeight="$semibold"
                    >
                        Receiver
                    </Text>
                </Box>
                <Box mt="$8" display="table-cell">
                    <Text
                        color="$textSecondary"
                        fontSize="$sm"
                        fontWeight="$semibold"
                    >
                        {receiver}
                    </Text>
                </Box>
            </Box>
            <Box mt="$8" display="table-row">
                <Box mt="$8" display="table-cell">
                    <Text fontSize="$sm" fontWeight="$bold">
                        Flow Rate:
                    </Text>
                </Box>
                <Box mt="$8" display="table-cell">
                    <Text fontSize="$sm" fontWeight="$bold">
                        {exponentiate(streamData.flowRate?.toString(), -exponent).toFixed(9)} {chainCoin.symbol} / sec
                    </Text>
                </Box>
            </Box>
            <Box mt="$8" display="table-row">
                <Box mt="$8" display="table-cell">
                    <Text fontSize="$sm" fontWeight="$bold">
                        Deposit:
                    </Text>
                </Box>
                <Box mt="$8" display="table-cell">
                    <Text fontSize="$sm" fontWeight="$bold">
                        {exponentiate(streamData.deposit.amount.toString(), -exponent).toFixed(9)} {chainCoin.symbol}
                    </Text>
                </Box>
            </Box>
            <Box mt="$8" display="table-row">
                <Box mt="$8" display="table-cell">
                    <Text fontSize="$sm" fontWeight="$bold">
                        Deposit Zero Time:
                    </Text>
                </Box>
                <Box mt="$8" display="table-cell">
                    <Text fontSize="$sm" fontWeight="$bold">
                        {streamData.depositZeroTime.toLocaleString()}
                    </Text>
                </Box>
            </Box>
            <Box mt="$8" display="table-row">
                <Box mt="$8" display="table-cell">
                    <Text fontSize="$sm" fontWeight="$bold">
                        Last Claim Time:
                    </Text>
                </Box>
                <Box mt="$8" display="table-cell">
                    <Text fontSize="$sm" fontWeight="$bold">
                        {streamData.lastOutflowTime.toLocaleString()}
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
                        {exponentiate(claimable, -exponent).toFixed(9)} {chainCoin.symbol}
                    </Text>
                </Box>
            </Box>
            <Box mt="$8" display="table-row">
                <Box mt="$8" display="table-cell">

                </Box>
                <Box mt="$8" display="table-cell">
                    <Text fontSize="$sm" fontWeight="$bold">
                        { isSender ? editButtons : claim}
                    </Text>
                </Box>
            </Box>

            <BasicModal
                title={
                    <Box maxWidth="40rem">
                        <Text fontSize="$xl" fontWeight="$bold">Top Up Deposit</Text>
                    </Box>
                }
                isOpen={topupDepositModal.open}
                onOpen={openTopupDepositModal}
                onClose={closeTopupDepositModal}
            >
                <form onSubmit={handleTopupDepositSubmit} className={"payment-stream-form"}>

                    <label>
                        Deposit:
                        <input type="text" name="deposit" size={3} value={topUpFormData.deposit}
                               onChange={handleTopupDepositInputChange}/> {chainCoin.symbol}
                    </label>
                    <br/>
                    <button type="submit">Top Up</button>
                </form>
            </BasicModal>

            <BasicModal
                title={
                    <Box maxWidth="40rem">
                        <Text fontSize="$xl" fontWeight="$bold">Update Flow Rate</Text>
                    </Box>
                }
                isOpen={updateFlowRateModal.open}
                onOpen={openUpdateFlowRateModal}
                onClose={closeUpdateFlowRateModal}
            >
                <form onSubmit={handleUpdateFlowRateSubmit} className={"payment-stream-form"}>

                    <label>
                        Send:
                        <input type="text" name="fund" value={updateFlowFormData.fund}
                               onChange={handleUpdateFlowRateInputChange}/> FUND
                    </label>
                    <br/>
                    <label>
                        Every
                        <input type="text" size={1} name="duration" value={updateFlowFormData.duration}
                               onChange={handleUpdateFlowRateInputChange}/>
                    </label>
                    <label>
                        <select value={updateFlowFormData.period} onChange={handleUpdateFlowRateInputChange}
                                name="period">
                            <option value="1">Second</option>
                            <option value="2">Minute</option>
                            <option value="3">Hour</option>
                            <option value="4">Day</option>
                            <option value="5">Week</option>
                            <option value="6">Month</option>
                            <option value="7">Year</option>
                        </select>
                    </label>
                    <br />
                    <button type="submit">Calculate</button>
                </form>
            </BasicModal>

            <BasicModal
                title={
                    <Box maxWidth="40rem">
                        <Text fontSize="$xl" fontWeight="$bold">Send New Flow Rate</Text>
                    </Box>
                }
                isOpen={sendUpdateFlowRateModal.open}
                onOpen={openSendUpdateFlowRateModal}
                onClose={closeSendUpdateFlowRateModal}
            >
                <form onSubmit={handleSendUpdateFlowRateSubmit} className={"payment-stream-form"}>

                    <Text
                        color="$textSecondary"
                        fontSize="$sm"
                        fontWeight="$semibold"
                    >
                        Updating the flow rate will also result in approx. {exponentiate(claimable, -exponent).toFixed(3)} {chainCoin.symbol} being
                        sent to the receiver before the new flow rate is applied.
                    </Text>

                    <br />

                    <label>
                        <strong>New Flow Rate:</strong> {updateFlowFormData.flowRate} nund/sec ({exponentiate(updateFlowFormData.flowRate, -exponent).toFixed(9)} {chainCoin.symbol} / sec)
                        <input type="hidden" name="flowRate" value={updateFlowFormData.flowRate}/> FUND
                    </label>
                    <br /><br />
                    <button type="submit">Send</button>
                </form>
            </BasicModal>


            <BasicModal
                title={
                    <Box maxWidth="40rem">
                        <Text fontSize="$xl" fontWeight="$bold">Cancel Stream</Text>
                    </Box>
                }
                isOpen={cancelStreamModal.open}
                onOpen={openCancelStreamModal}
                onClose={closeCancelStreamModal}
            >
                <form onSubmit={handleCancelStreamSubmit} className={"payment-stream-form"}>

                    <Text
                        color="$textSecondary"
                        fontSize="$sm"
                        fontWeight="$semibold"
                    >
                        Cancelling the stream result in approx. {exponentiate(claimable, -exponent).toFixed(3)} {chainCoin.symbol} being
                        sent to the receiver.
                        <br />
                        You will be refunded approx. {exponentiate(remainingDeposit, -exponent).toFixed(3)} {chainCoin.symbol}
                    </Text>
                    <br />
                    <button type="submit">Cancel Stream</button>
                </form>
            </BasicModal>
        </Box>
    )
}
