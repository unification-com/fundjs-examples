import { Secp256k1HdWallet } from "@cosmjs/amino";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { stringToPath } from "@cosmjs/crypto";

// HD path builder for `m/44'/<slip44>'/0'/0/<account>`. Replaces
// `cosmjs-utils.makeHdPath` so we don't pull in the legacy
// `@cosmjs/crypto@0.29.5` that `cosmjs-utils@^0.1.0` carries.
const buildHdPath = (slip44, account) =>
  stringToPath(`m/44'/${slip44}'/0'/0/${account}`);

export const getOfflineSignerProtoAccNum = async ({
  mnemonic,
  chain,
  account = 0,
}) => {
  try {
    const { bech32_prefix, slip44 } = chain;
    return await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
      prefix: bech32_prefix,
      hdPaths: [buildHdPath(slip44, account)],
    });
  } catch (e) {
    console.log("bad mnemonic");
  }
};

export const getOfflineSignerAminoAccNum = async ({
  mnemonic,
  chain,
  account = 0,
}) => {
  try {
    const { bech32_prefix, slip44 } = chain;
    return await Secp256k1HdWallet.fromMnemonic(mnemonic, {
      prefix: bech32_prefix,
      hdPaths: [buildHdPath(slip44, account)],
    });
  } catch (e) {
    console.log("bad mnemonic");
  }
};

// Default-account convenience used by `tx.rpc.mjs`. Previously came from
// `cosmjs-utils` as `getOfflineSignerAmino`; thin wrapper keeps the call
// site unchanged.
export const getOfflineSignerAmino = ({ mnemonic, chain }) =>
  getOfflineSignerAminoAccNum({ mnemonic, chain, account: 0 });
