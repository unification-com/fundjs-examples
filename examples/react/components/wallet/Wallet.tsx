import { useEffect, useState } from "react";
import {
  Box,
  ClipboardCopyText,
  Stack,
  useColorModeValue,
  Text,
} from "@interchain-ui/react";
import { WalletStatus } from "@cosmos-kit/core";
import { useChain } from "@cosmos-kit/react";
import { chains } from "@/config";
import { defaultChainName } from "@/config";
import { ChainSelect } from "./Chain";
import { Warning } from "./Warning";
import { User } from "./User";
import { FaWallet } from "react-icons/fa";
import {
  ButtonConnect,
  ButtonConnected,
  ButtonConnecting,
  ButtonDisconnected,
  ButtonError,
  ButtonNotExist,
  ButtonRejected,
} from "./Connect";
import { usePaymentStreamData, useQueryBalance } from "@/hooks";
import { exponentiate, getExponent } from "@/utils";

export const CHAIN_NAME_STORAGE_KEY = "selected-chain";

export type WalletProps = {
  chainName?: string;
  onChainChange?: (chainName?: string) => void;
};

export function Wallet({
  chainName = defaultChainName,
  onChainChange = () => {},
}: WalletProps) {
  const {
    chain,
    status,
    wallet,
    username,
    address,
    message,
    connect,
    openView,
  } = useChain(chainName);
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
  const exponent = getExponent(chainName);
  const [currentBalance, setCurrentBalance] = useState<any>(null);
  const ConnectButton = {
    [WalletStatus.Connected]: <ButtonConnected onClick={openView} />,
    [WalletStatus.Connecting]: <ButtonConnecting />,
    [WalletStatus.Disconnected]: <ButtonDisconnected onClick={connect} />,
    [WalletStatus.Error]: <ButtonError onClick={openView} />,
    [WalletStatus.Rejected]: <ButtonRejected onClick={connect} />,
    [WalletStatus.NotExist]: <ButtonNotExist onClick={openView} />,
  }[status] || <ButtonConnect onClick={connect} />;

  function handleChainChange(chainName?: string) {
    if (chainName) {
      onChainChange(chainName);
      localStorage.setItem(CHAIN_NAME_STORAGE_KEY, chainName!);
    }
  }
  const balance = (
    <>
      <Text fontSize="$lg" fontWeight={"$bold"} textAlign={"center"}>
        Balance:{" "}
        {parseInt(currentBalance?.balance?.amount, 10) > 0
          ? new Intl.NumberFormat("en-GB").format(
              exponentiate(currentBalance?.balance?.amount, -exponent)
            )
          : 0}{" "}
        FUND
      </Text>
    </>
  );
  useEffect(() => {
    if (
      balanceData &&
      balanceData.balance !== undefined &&
      parseInt(balanceData?.balance?.amount, 10) !==
        parseInt(currentBalance?.balance?.amount, 10)
    ) {
      setCurrentBalance(balanceData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [balanceData]);
  useEffect(() => {
    const selected = localStorage.getItem(CHAIN_NAME_STORAGE_KEY);
    if (selected && selected !== chainName) {
      onChainChange(selected);
    }
  }, []);
  return (
    <Box pt="$16" pb="$8" display="flex" gap="20px" flexWrap={"wrap"}>
      <Box maxWidth="28rem" display={"flex"} flexDirection={"column"}>
        <Box mx="auto" maxWidth="28rem" attributes={{ mb: "$2" }}>
          {chains.length > 1 ? (
            <ChainSelect
              chains={chains}
              chainName={chain.chain_name}
              onChange={handleChainChange}
            />
          ) : null}
        </Box>
        <Stack
          direction="vertical"
          attributes={{
            mx: "auto",
            mt: "$4",
            px: "$8",
            py: "$1",
            maxWidth: "22rem",
            width: "100%",
            borderRadius: "$lg",
            justifyContent: "center",
            // backgroundColor: useColorModeValue("#F5F7FB", "#0F172A"),
            backgroundColor: "$cardBg",
            boxShadow: useColorModeValue(
              "0 0 2px #dfdfdf, 0 0 6px -2px #d3d3d3",
              "0 0 2px #363636, 0 0 8px -2px #4f4f4f"
            ),
          }}
        >
          {username ? <User name={username} /> : null}
          {address ? (
            <ClipboardCopyText text={address} truncate="middle" />
          ) : null}
          <Box
            my="$8"
            flex="1"
            width="full"
            display="flex"
            height="$16"
            overflow="hidden"
            justifyContent="center"
            px={{ mobile: "$8", tablet: "$10" }}
          >
            {ConnectButton}
          </Box>

          {message &&
          [WalletStatus.Error, WalletStatus.Rejected].includes(status) ? (
            <Warning text={`${wallet?.prettyName}: ${message}`} />
          ) : null}
        </Stack>
      </Box>

      {address && (
        <Box backgroundColor="$cardBg" flexGrow={1} borderRadius={"6px"}>
          <Box pt="$4" pb="$4" mb="$3" pl="$8">
            <Text fontSize="24px" fontWeight={"$bold"}>
              Balance
            </Text>
          </Box>
          <Box
            backgroundColor={"$cardBg"}
            borderRadius="6px"
            mt="$12"
            display={"flex"}
            alignItems={"end"}
            gap={"10px"}
            justifyContent={"center"}
          >
            <Text fontSize="$lg" fontWeight={"$bold"}>
              <Box pb="$9">
                <FaWallet size={"30px"} />
              </Box>
            </Text>
            <Text fontSize="58px" fontWeight={"$bold"}>
              {parseInt(currentBalance?.balance?.amount, 10) > 0
                ? new Intl.NumberFormat("en-GB").format(
                    exponentiate(currentBalance?.balance?.amount, -exponent)
                  )
                : 0}
            </Text>
            <Text fontSize="$lg" fontWeight={"$bold"}>
              <Box pb="$8">FUND</Box>
            </Text>
          </Box>
        </Box>
      )}
    </Box>
  );
}
