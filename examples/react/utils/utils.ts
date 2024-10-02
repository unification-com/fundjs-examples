import dayjs from 'dayjs';
import BigNumber from 'bignumber.js';
import {Chain} from '@chain-registry/types';
import {assets, chains} from '@/config';
import {AssetList, Asset} from '@chain-registry/types';
import {StreamPeriod} from "@unification-com/fundjs-react/mainchain/stream/v1/stream";
import {parseCoins} from "@cosmjs/stargate";
import {Coins} from "@hexxagon/feather.js";

export function getChainLogo(chain: Chain) {
    return chain.logo_URIs?.svg || chain.logo_URIs?.png || chain.logo_URIs?.jpeg;
}

export function formatDate(date?: Date) {
    if (!date) return null;
    return dayjs(date).format('YYYY-MM-DD hh:mm:ss');
};

export function paginate(limit: bigint, reverse: boolean = false, key: Uint8Array = new Uint8Array()) {
    return {
        limit,
        reverse,
        key,
        offset: 0n,
        countTotal: true,
    }
}

export function percent(num: number | string = 0, total: number, decimals = 2) {
    return total ? new BigNumber(num).dividedBy(total).multipliedBy(100).decimalPlaces(decimals).toNumber() : 0;
}

export const getChainAssets = (chainName: string) => {
    return assets.find((chain) => chain.chain_name === chainName) as AssetList;
};

export const getChainInfo = (chainName: string) => {
    return chains.find((chain) => chain.chain_name === chainName) as Chain;
};

export const getExplorerList = (chainName: string) => {
    const chainInfo = getChainInfo(chainName);
    return chainInfo.explorers ? chainInfo.explorers : [];
};

export const getExplorer = (chainName: string) => {
    const explorerList = getExplorerList(chainName);
    return explorerList.length > 0 ? explorerList[0] : {};
};

export const getRpcList = (chainName: string) => {
    const chainInfo = getChainInfo(chainName);
    // @ts-ignore
    return chainInfo.apis.rpc ? chainInfo.apis.rpc : [];
};

export const getRpc = (chainName: string) => {
    const rpcList = getRpcList(chainName);
    return rpcList.length > 0 ? rpcList[0].address : "";
};

export const getWebsocketList = (chainName: string) => {
    const chainInfo = getChainInfo(chainName);
    // @ts-ignore
    return chainInfo.apis.wss ? chainInfo.apis.wss : [];
};

export const getWebsocket = (chainName: string) => {
    const wsList = getWebsocketList(chainName);
    return wsList.length > 0 ? wsList[0].address : "";
};

export const getCoin = (chainName: string) => {
    const chainAssets = getChainAssets(chainName);
    return chainAssets.assets[0] as Asset;
};

export const getExponent = (chainName: string) => {
    return getCoin(chainName).denom_units.find(
        (unit) => unit.denom === getCoin(chainName).display
    )?.exponent as number;
};

export const exponentiate = (num: number | string | undefined, exp: number) => {
    if (!num) return 0;
    return new BigNumber(num)
        .multipliedBy(new BigNumber(10).exponentiatedBy(exp))
        .toNumber();
};

export function decodeUint8Array(value?: Uint8Array) {
    return value ? new TextDecoder('utf-8').decode(value) : '';
}

export function getTitle(value?: Uint8Array) {
    return decodeUint8Array(value).slice(0, 250).match(/[A-Z][A-Za-z].*(?=\u0012)/)?.[0];
};

export function parseQuorum(value?: Uint8Array) {
    const quorum = decodeUint8Array(value);
    return new BigNumber(quorum).shiftedBy(-quorum.length).toNumber();
}

export function parseStreamError(value: string) {
    if(value.includes("stream exists")) {
        return "Stream from this sender to receiver already exists. Use the update stream function if you wish to modify it"
    }
    if(value.includes("receiver cannot be same as sender")) {
        return "Receiver address cannot be same as sender address";
    }

    return value
}

export function truncateAddress(fullStr: string, strLen: number = 20, separator: string = "...") {
    if (fullStr.length <= strLen) return fullStr;

    separator = separator || '...';

    var sepLen = separator.length,
        charsToShow = strLen - sepLen,
        frontChars = Math.ceil(charsToShow/2),
        backChars = Math.floor(charsToShow/2);

    return fullStr.substr(0, frontChars) +
        separator +
        fullStr.substr(fullStr.length - backChars);
}

export function calculateFlowRate(amount: number, period: string, duration: string): number {

    let baseDuration = 1
    let totalDuration = 1
    const p = parseInt(period, 10)
    const d = parseInt(duration)

    switch (p) {
        case StreamPeriod.STREAM_PERIOD_UNSPECIFIED:
            baseDuration = 1
            break
        case StreamPeriod.STREAM_PERIOD_SECOND:
        default:
            baseDuration = 1
            break
        case StreamPeriod.STREAM_PERIOD_MINUTE:
            baseDuration = 60
            break
        case StreamPeriod.STREAM_PERIOD_HOUR:
            baseDuration = 3600
            break
        case StreamPeriod.STREAM_PERIOD_DAY:
            baseDuration = 86400
            break
        case StreamPeriod.STREAM_PERIOD_WEEK:
            baseDuration = 604800
            break
        case StreamPeriod.STREAM_PERIOD_MONTH:
            baseDuration = 2628000 // (365 / 12) * 24 * 60 * 60 = 30.416666667 * 24 * 60 * 60
            break
        case StreamPeriod.STREAM_PERIOD_YEAR:
            baseDuration = 31536000
            break
    }

    totalDuration = baseDuration * d

    return Math.floor(amount / totalDuration)
}
