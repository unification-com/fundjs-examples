import { Registry } from "@cosmjs/proto-signing";
import { AminoTypes } from "@cosmjs/stargate";

// fundjs-react@^0.2.0 (telescope 2.x) replaced the previous
// `cosmosProtoRegistry` / `mainchainAminoConverters` / etc. aggregate
// arrays with per-module bundles. Each `<module>/<vN>/tx.registry`
// exports `registry: ReadonlyArray<[typeUrl, GeneratedType]>` and each
// `<module>/<vN>/tx.amino` exports `AminoConverter: Record<typeUrl,
// converter>`. We compose them by hand so the signing client below
// supports the full Cosmos + IBC + Mainchain Msg surface.
//
// If a future Mainchain release adds a new x/<module>/v<N> with Msgs,
// add its `tx.registry` + `tx.amino` imports to the arrays below.

// Cosmos SDK Msgs we may sign — bank/staking/distribution/gov are the
// big four; expand as more flows land.
import { registry as bankRegistry } from "@unification-com/fundjs-react/cosmos/bank/v1beta1/tx.registry";
import { registry as stakingRegistry } from "@unification-com/fundjs-react/cosmos/staking/v1beta1/tx.registry";
import { registry as distributionRegistry } from "@unification-com/fundjs-react/cosmos/distribution/v1beta1/tx.registry";
import { registry as govRegistry } from "@unification-com/fundjs-react/cosmos/gov/v1beta1/tx.registry";
import { AminoConverter as bankAmino } from "@unification-com/fundjs-react/cosmos/bank/v1beta1/tx.amino";
import { AminoConverter as stakingAmino } from "@unification-com/fundjs-react/cosmos/staking/v1beta1/tx.amino";
import { AminoConverter as distributionAmino } from "@unification-com/fundjs-react/cosmos/distribution/v1beta1/tx.amino";
import { AminoConverter as govAmino } from "@unification-com/fundjs-react/cosmos/gov/v1beta1/tx.amino";

// IBC transfer Msgs.
import { registry as ibcTransferRegistry } from "@unification-com/fundjs-react/ibc/applications/transfer/v1/tx.registry";
import { AminoConverter as ibcTransferAmino } from "@unification-com/fundjs-react/ibc/applications/transfer/v1/tx.amino";

// Unification custom modules.
import { registry as streamRegistry } from "@unification-com/fundjs-react/mainchain/stream/v1/tx.registry";
import { registry as beaconRegistry } from "@unification-com/fundjs-react/mainchain/beacon/v1/tx.registry";
import { registry as wrkchainRegistry } from "@unification-com/fundjs-react/mainchain/wrkchain/v1/tx.registry";
import { registry as enterpriseRegistry } from "@unification-com/fundjs-react/mainchain/enterprise/v1/tx.registry";
import { AminoConverter as streamAmino } from "@unification-com/fundjs-react/mainchain/stream/v1/tx.amino";
import { AminoConverter as beaconAmino } from "@unification-com/fundjs-react/mainchain/beacon/v1/tx.amino";
import { AminoConverter as wrkchainAmino } from "@unification-com/fundjs-react/mainchain/wrkchain/v1/tx.amino";
import { AminoConverter as enterpriseAmino } from "@unification-com/fundjs-react/mainchain/enterprise/v1/tx.amino";

export const defaultChainName = process.env.NEXT_PUBLIC_DEFAULT_CHAIN
  ? process.env.NEXT_PUBLIC_DEFAULT_CHAIN
  : "unification";

const protoRegistry = [
  ...bankRegistry,
  ...stakingRegistry,
  ...distributionRegistry,
  ...govRegistry,
  ...ibcTransferRegistry,
  ...streamRegistry,
  ...beaconRegistry,
  ...wrkchainRegistry,
  ...enterpriseRegistry,
];

const aminoConverters = {
  ...bankAmino,
  ...stakingAmino,
  ...distributionAmino,
  ...govAmino,
  ...ibcTransferAmino,
  ...streamAmino,
  ...beaconAmino,
  ...wrkchainAmino,
  ...enterpriseAmino,
};

// Enables signing of Cosmos, IBC and Mainchain Txs.
export const registry = new Registry(protoRegistry);
export const aminoTypes = new AminoTypes(aminoConverters);
