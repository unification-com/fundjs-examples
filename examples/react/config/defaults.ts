import { GeneratedType, Registry } from '@cosmjs/proto-signing';
import { AminoTypes } from '@cosmjs/stargate';
import {
    cosmosAminoConverters,
    cosmosProtoRegistry,
    ibcProtoRegistry,
    ibcAminoConverters,
    mainchainAminoConverters,
    mainchainProtoRegistry,
} from '@unification-com/fundjs-react';

export const defaultChainName = 'unification';

const protoRegistry: ReadonlyArray<[string, GeneratedType]> = [
    ...cosmosProtoRegistry,
    ...ibcProtoRegistry,
    ...mainchainProtoRegistry,
];

const aminoConverters = {
    ...cosmosAminoConverters,
    ...ibcAminoConverters,
    ...mainchainAminoConverters,
};

// Enables signing of Cosmos, IBC and Mainchain Txs
export const registry = new Registry(protoRegistry);
export const aminoTypes = new AminoTypes(aminoConverters);
