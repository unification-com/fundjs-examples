# fundjs-examples

A few examples using `fundjs` and `fundjs-react`.

The examples require a local DevNet to be running. This repo includes a script for quickly
starting and running a DevNet.

## Compatibility

| Examples branch | fundjs | fundjs-react | cosmjs | Mainchain |
|---|---|---|---|---|
| `dev` (current) | `^0.2.0` | `^0.2.0` | `^0.38.0` | `8-vaxildan` upgrade + later (SDK v0.54.3 / IBC-go v11 / CometBFT v0.39) |
| `main` historical | `^0.1.0` | `^0.1.0` | `^0.32.4` | up to `7-taryon` (SDK v0.50 era) |

The `^0.2.0` bump aligns with the vaxildan-era stream-key widening: `MsgClaimStream` / `MsgCancelStream` / `MsgUpdateFlowRate` and the `streamByReceiverSender` query all now require a `denom` field to disambiguate which stream within a `(sender, receiver)` pair to act on. Examples updated to pass `denom: 'nund'` (the Unification chain's base denom). The `devnet.sh` script auto-resolves the latest released `und` binary via the GitHub API — no hardcoded version change needed; once vaxildan releases, the DevNet picks it up automatically.

## DevNet

To start the DevNet with the default configuration, run:

```bash
./scripts/devnet.sh
```

The default configuration is as follows:

| Setting   | Value                                                                                                                                                                          |
|-----------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Base Path | /tmp/und_devnets                                                                                                                                                               |
| Mnemonic  | wish glad forget ski rhythm mouse omit gun fatal whale switch gift nephew cactus noise athlete spin damp never jacket absorb client top grass                                  |
| Chain ID  | `FUND-DevNet`                                                                                                                                                                  |
| Validator | und1eq239sgefyzm4crl85nfyvt7kw83vrna3f0eed <br /> undvaloper1eq239sgefyzm4crl85nfyvt7kw83vrna6lrjet <br /> /tmp/und_devnets/v1.10.1/.und_mainchain/keyring-test/validator.info |
| Wallets   | First 10 from Mnemonic. 0 is the validator wallet. 1 - 9 funded with 1,000,000 FUND. <br /> See [scripts/default.devnet.json](./scripts/default.devnet.json) for addresses     |


### Configuring DevNet

By default, the DevNet script will use the mnemonic and genesis wallets configured in
[scripts/default.devnet.json](./scripts/default.devnet.json).

The DevNet script can be configured as required, for example with a custom wallet mnemonic seed
and list of wallet addresses to be funded by creating `scripts/devnet.json`:

```bash
cp scripts/default.devnet.json scripts/devnet.json
nano scripts/devnet.json
```

### DevNet & Keplr

Keplr can be configured to connect to DevNet. To fund your Keplr wallet with DevNet FUND, simply add the
wallet addresses to your custom `scripts/devnet.json` before running the script.

**Note:** if you have previously run the DevNet, you will need to delete the directory before running
the `scripts/devnet.sh` in order for the custom wallets to be included in genesis, e.g.

```bash
rm -rf /tmp/und_devnets/v1.10.1
./scripts/devnet.sh
```

## Current Examples

The repo contains the following directories with examples

|                             | Desctription                                                                     | Implements     |
|-----------------------------|----------------------------------------------------------------------------------|----------------|
| [simple](./examples/simple) | collection of simple examples to be run via the `node` command                   | `fundjs`       |
| [react](./examples/react)   | simple React UI built using "Create Cosmos App" to interact with Payment Streams | `fundjs-react` |

## Usage

See respective READMEs and code in each example directory.
