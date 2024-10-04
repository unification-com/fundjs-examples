import React, { useState, useEffect } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";
// @ts-ignore
import { v4 as uuidv4 } from "uuid";
import {
  parseEvent,
} from "@/utils";
import {
  Box,
  Text,
  Stack,
  ListItem,
} from "@interchain-ui/react";
import { useChain } from "@cosmos-kit/react";
import {ExplorerLink} from "@/components/streams/ExplorerLink";
import {StreamEvent} from "@/components/streams/StreamEvent";

export type WebSocketProps = {
  chainName: string;
};

export const WebSocket = ({ chainName }: WebSocketProps) => {
  const { chain, address } = useChain(chainName);
  const [socketUrl, setSocketUrl] = useState("");
  const [messageHistory, setMessageHistory] = useState<React.JSX.Element[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [currentAddress, setCurrentAddress] = useState<string>("");
  const [sendersReceivers, setSendersReceivers] = useState<string[]>([]);

  useEffect(() => {
    if (chain.apis?.wss) {
      setSocketUrl(chain.apis?.wss[0].address);
    } else if (chain.apis?.rpc) {
      // attempt best guess - may not be accurate
      const wss = chain.apis?.rpc[0].address.replace("http", "ws");
      setSocketUrl(`${wss}/websocket`);
    }
  }, [chain]);

  useEffect(() => {
    if (address && address !== currentAddress) {
      const sr = [...sendersReceivers];
      if (!sr.includes(address)) {
        setCurrentAddress(address);
        setMessageHistory([]);
      }
    }
  }, [address]);

  const { sendMessage, lastMessage, readyState } = useWebSocket(socketUrl, {
    share: true,
  });


  function isSenderOrReceiver(sender: string, receiver: string): boolean {
    const sr = [...sendersReceivers];
    if (!sr.includes(sender)) {
      sr.push(sender);
    }
    if (!sr.includes(receiver)) {
      sr.push(receiver);
    }
    setSendersReceivers(sr);
    return sender === address || receiver === address;
  }

  useEffect(() => {
    if (lastMessage !== null) {
      const res = JSON.parse(lastMessage.data.toString());
      let prev = [...messageHistory];
      let txHash = "";
      if (res.result?.events) {
        txHash = res.result?.events["tx.hash"][0];
      }

      for (
        let i = 0;
        i < res.result.data?.value.TxResult.result.events.length;
        i++
      ) {
        const e = res.result.data?.value.TxResult.result.events[i];

        const eventRes = parseEvent(e)
        if(!isSenderOrReceiver(eventRes.sender, eventRes.receiver)) {
          continue
        }

        const msg = (<>
          Tx <ExplorerLink chainName={chainName} value={txHash} what={"tx"} truncate={true} /> - <StreamEvent chainName={chainName} e={eventRes}/>
        </>)

        if (prev.length >= 10) {
          prev.pop();
        }
        prev = [msg].concat(prev);
      }

      setMessageHistory(prev);
    }
  }, [lastMessage]);

  useEffect(() => {
    if (readyState === ReadyState.OPEN && !isSubscribed) {
      sendMessage(
        JSON.stringify({
          jsonrpc: "2.0",
          method: "subscribe",
          params: ["message.module='stream'"],
          id: uuidv4(),
        })
      );
      setIsSubscribed(true);
    }
  }, [readyState, isSubscribed]);

  const connectionStatus = {
    [ReadyState.CONNECTING]: "Connecting",
    [ReadyState.OPEN]: "Open",
    [ReadyState.CLOSING]: "Closing",
    [ReadyState.CLOSED]: "Closed",
    [ReadyState.UNINSTANTIATED]: "Uninstantiated",
  }[readyState];

  return (
        !address ? null : <Box
            borderRadius="$lg"
            // backgroundColor={useColorModeValue("#F5F7FB", "#0F172A")}
            backgroundColor="$cardBg"
            px="$10"
            pt="$4"
            pb="$2"
        >
          <Text fontSize={"$lg"} fontWeight={"$bold"}>
            Websocket events for {address} Payment Streams
          </Text>
          <Box mb="$4">
            <Text>The WebSocket is currently {connectionStatus}</Text>
          </Box>
          <Stack as="ul" space="1" direction="vertical">
            {messageHistory?.map((message, idx) => (
                <ListItem key={`ws_event${idx}`} size={"sm"}>
                  - {message ? message : null}
                </ListItem>
            ))}
          </Stack>
        </Box>

  );
};
