import { useChain } from "@cosmos-kit/react";
import {
    Box,
    Spinner,
    Text,
    useColorModeValue,
} from "@interchain-ui/react";
import { usePaymentStreamData } from "@/hooks";
import {exponentiate, formatDate, getCoin, getExponent} from "@/utils";

export type StreamsProps = {
    chainName: string;
};

export function Streams({ chainName }: StreamsProps) {
    const { address } = useChain(chainName);
    const { data, isLoading, refetch } = usePaymentStreamData(chainName);

    const coin = getCoin(chainName);
    const exponent = getExponent(chainName);

    const content = (
        <Box mt="$12">
            {data.streams?.map((streamRes, index) => (
                <Box
                    my="$8"
                    key={`${streamRes.sender?.toString()}-${streamRes.receiver?.toString()}` || index}
                    position="relative"
                >
                    <Text fontSize="$sm" fontWeight="$bold">
                       {streamRes.sender} -&gt; {streamRes.receiver}
                    </Text>
                    <Text fontSize="$sm" fontWeight="$bold">
                        Flow Rate: {exponentiate(streamRes.stream.flowRate, -exponent).toFixed(9)} {coin.symbol} / sec
                    </Text>
                    <Text fontSize="$sm" fontWeight="$bold">
                        Remaining Deposit: { exponentiate(streamRes.stream.deposit.amount, -exponent).toFixed(3) } {coin.symbol}

                    </Text>
                    <Text fontSize="$sm" fontWeight="$bold">
                        Deposit Zero Time: {formatDate(streamRes.stream.depositZeroTime)}
                    </Text>
                    <Text fontSize="$sm" fontWeight="$bold">
                        Last Claim Time: {formatDate(streamRes.stream.lastOutflowTime)}
                    </Text>
                </Box>
            ))}
        </Box>
    );

    const connect = (
        <Box mt="$8" display="flex" alignItems="center" justifyContent="center">
            <Text fontSize="$lg">
                Please connect to your wallet to see the streams.
            </Text>
        </Box>
    );

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

    return (
        <Box mb="$20" position="relative">
            <Text fontWeight="600" fontSize="$2xl">Payment Streams</Text>

            {address ? Loading : null}

            {address ? content : connect}

        </Box>
    );
}
