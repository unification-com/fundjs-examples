// Shared cosmjs Registry + AminoTypes for the three signing scripts.
//
// fundjs@^0.2.0 (telescope 2.x) replaced the previous aggregate
// `cosmosProtoRegistry` / `cosmosAminoConverters` / etc. exports with
// per-module bundles. Each `<module>/<vN>/tx.registry` exports
// `registry: ReadonlyArray<[typeUrl, GeneratedType]>` and each
// `<module>/<vN>/tx.amino` exports `AminoConverter: Record<typeUrl,
// converter>`. We compose them by hand here so all three signing
// scripts (`tx.rpc.mjs`, `custom.tx.rpc.mjs`, `stream.tx.rpc.mjs`)
// share a single source of truth and stay DRY.
//
// If a future Mainchain release adds a new `x/<module>/v<N>` Msg
// surface, add its `tx.registry` + `tx.amino` imports below.

import { Registry } from "@cosmjs/proto-signing";
import { AminoTypes } from "@cosmjs/stargate";

// Cosmos SDK Msgs.
import { registry as bankRegistry } from "@unification-com/fundjs/cosmos/bank/v1beta1/tx.registry.js";
import { registry as stakingRegistry } from "@unification-com/fundjs/cosmos/staking/v1beta1/tx.registry.js";
import { registry as distributionRegistry } from "@unification-com/fundjs/cosmos/distribution/v1beta1/tx.registry.js";
import { registry as govRegistry } from "@unification-com/fundjs/cosmos/gov/v1beta1/tx.registry.js";
import { AminoConverter as bankAmino } from "@unification-com/fundjs/cosmos/bank/v1beta1/tx.amino.js";
import { AminoConverter as stakingAmino } from "@unification-com/fundjs/cosmos/staking/v1beta1/tx.amino.js";
import { AminoConverter as distributionAmino } from "@unification-com/fundjs/cosmos/distribution/v1beta1/tx.amino.js";
import { AminoConverter as govAmino } from "@unification-com/fundjs/cosmos/gov/v1beta1/tx.amino.js";

// IBC transfer Msgs.
import { registry as ibcTransferRegistry } from "@unification-com/fundjs/ibc/applications/transfer/v1/tx.registry.js";
import { AminoConverter as ibcTransferAmino } from "@unification-com/fundjs/ibc/applications/transfer/v1/tx.amino.js";

// Unification custom modules.
import { registry as streamRegistry } from "@unification-com/fundjs/mainchain/stream/v1/tx.registry.js";
import { registry as beaconRegistry } from "@unification-com/fundjs/mainchain/beacon/v1/tx.registry.js";
import { registry as wrkchainRegistry } from "@unification-com/fundjs/mainchain/wrkchain/v1/tx.registry.js";
import { registry as enterpriseRegistry } from "@unification-com/fundjs/mainchain/enterprise/v1/tx.registry.js";
import { AminoConverter as streamAmino } from "@unification-com/fundjs/mainchain/stream/v1/tx.amino.js";
import { AminoConverter as beaconAmino } from "@unification-com/fundjs/mainchain/beacon/v1/tx.amino.js";
import { AminoConverter as wrkchainAmino } from "@unification-com/fundjs/mainchain/wrkchain/v1/tx.amino.js";
import { AminoConverter as enterpriseAmino } from "@unification-com/fundjs/mainchain/enterprise/v1/tx.amino.js";

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

export const registry = new Registry(protoRegistry);
export const aminoTypes = new AminoTypes(aminoConverters);
