#!/bin/bash

#########################################################
# A script for quickly spinning up a single node        #
# local devnet using the specified released version     #
# of und                                                #
#                                                       #
# Usage:                                                #
#   ./scripts/devnet.sh <UND_VERS>                      #
#                                                       #
# Example:                                              #
#   ./scripts/devnet.sh v1.10.1                          #
#                                                       #
# binary:   /tmp/und_devnets/<UND_VERS>/und             #
# und home: /tmp/und_devnets/<UND_VERS>/.und_mainchain  #
# chain-id: FUND-DevNet                                 #
#                                                       #
# P2P:      tcp://localhost:26656                       #
# RPC:      (http || tcp)://localhost:26657             #
# LCD:      localhost:1317                              #
#                                                       #
# gRPC:     localhost:9090                              #
#                                                       #
#########################################################

set -e

# Devnet configuration
CHAIN_ID="FUND-DevNet"
DEFAULT_UND_VERS=$(curl -s https://api.github.com/repos/unification-com/mainchain/releases/latest | jq -r '.tag_name')

UND_VERS="${1}"

BASE_DIR="$(pwd)"
CONFIG="${BASE_DIR}/scripts/devnet.json"

function get_conf() {
  local P=${1}
  cat < "${CONFIG}" | jq -r "${P}"
}

if ! test -f "$CONFIG"; then
  echo "${CONFIG} not found. Using defaults."
  CONFIG="${BASE_DIR}/scripts/default.devnet.json"
fi

echo "Loading ${CONFIG}"
MNEMONIC=$(cat < "${CONFIG}" | jq -r ".mnemonic")
readarray -t GENESIS_WALLETS < <(cat < "${CONFIG}" | jq -cr '.genesis_wallets[]')
BASE_TEST_PATH=$(cat < "${CONFIG}" | jq -r ".base_path")

if [ -z "$BASE_TEST_PATH" ]; then
  echo "No base_path configured. Using default /tmp/und_devnets"
  BASE_TEST_PATH="/tmp/und_devnets"
fi

if [ -z "$UND_VERS" ]; then
  echo "UND_VERS not set. Using und ${DEFAULT_UND_VERS}"
  UND_VERS="${DEFAULT_UND_VERS}"
  sleep 1s
fi

# Set the test path
TEST_PATH="${BASE_TEST_PATH}/${UND_VERS}"

# Internal VARS
DATA_DIR="${TEST_PATH}/.und_mainchain"
UND_BIN="${TEST_PATH}/und"

function version_lt() { test "$(echo "$@" | tr " " "\n" | sort -rV | head -n 1)" != "$1"; }

if version_lt $UND_VERS "1.10.0"; then
  echo "versions < 1.10.0 not supported"
  exit 1
fi

# check for previous tests
if [ -d "$TEST_PATH" ]; then
  echo ""
  echo "Found previous test configuration in ${TEST_PATH}."
  echo ""
  echo "Either delete ${TEST_PATH} and rerun this script"
  echo "or start the chain again using:"
  echo ""
  echo "  ${UND_BIN} start --home ${DATA_DIR}"
  echo ""
  echo "You can also wipe the chain dat and start from"
  echo "block 0 by running the following befor starting:"
  echo ""
  echo "  ${UND_BIN} tendermint unsafe-reset-all --home ${DATA_DIR}"
  echo ""
  exit 0
fi

mkdir -p "${TEST_PATH}"

cd "${TEST_PATH}" || exit

# download & unpack und release
wget "https://github.com/unification-com/mainchain/releases/download/${UND_VERS}/und_${UND_VERS}_linux_x86_64.tar.gz"
tar -zxvf "und_${UND_VERS}_linux_x86_64.tar.gz"

# init chain
"${UND_BIN}" init devnet --home "${DATA_DIR}" --chain-id="${CHAIN_ID}"
"${UND_BIN}" config chain-id "${CHAIN_ID}" --home "${DATA_DIR}"
"${UND_BIN}" config keyring-backend test --home "${DATA_DIR}"

# change default denoms from stake to nund in genesis
sed -i "s/stake/nund/g" "${DATA_DIR}/config/genesis.json"

# add test keys to keychain
# add a validator
yes "${MNEMONIC}" | "${UND_BIN}" --home ${DATA_DIR} keys add validator --keyring-backend test --account 0 --recover
# Enterprise account
"${UND_BIN}" --home ${DATA_DIR} keys add ent1 --keyring-backend test
E_ADDR_RES=$("${UND_BIN}" --home ${DATA_DIR} keys show ent1 --output json --keyring-backend test 2>&1)
ENT1=$(echo "${E_ADDR_RES}" | jq --raw-output '.address')

sed -i "s/\"ent_signers\": \"und1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq5x8kpm\"/\"ent_signers\": \"$ENT1\"/g" "${DATA_DIR}/config/genesis.json"
sed -i "s/\"voting_period\": \"172800s\"/\"voting_period\": \"30s\"/g" "${DATA_DIR}/config/genesis.json"

sed -i "s/minimum-gas-prices = \"\"/minimum-gas-prices = \"25.0nund\"/g" "${DATA_DIR}/config/app.toml"
sed -i "s/enable = false/enable = true/g" "${DATA_DIR}/config/app.toml"
sed -i "s/swagger = false/swagger = true/g" "${DATA_DIR}/config/app.toml"


sed -i "s/enabled-unsafe-cors = false/enabled-unsafe-cors = true/g" "${DATA_DIR}/config/app.toml"
sed -i "s/cors_allowed_origins = \[\]/cors_allowed_origins = \[\"\*\"\]/g" "${DATA_DIR}/config/config.toml"


# add accounts to genesis
"${UND_BIN}" genesis add-genesis-account validator 1000000000000000nund --home "${DATA_DIR}" --keyring-backend test
"${UND_BIN}" genesis add-genesis-account ent1 1000000000000000nund --home "${DATA_DIR}" --keyring-backend test

for i in ${!GENESIS_WALLETS[@]}
do
  echo "${GENESIS_WALLETS[$i]}"
  "${UND_BIN}" genesis add-genesis-account "${GENESIS_WALLETS[$i]}" 1000000000000000nund --home "${DATA_DIR}"
done

# validator gentx
"${UND_BIN}" genesis gentx validator 1000000nund --home ${DATA_DIR} --chain-id="${CHAIN_ID}"
"${UND_BIN}" genesis collect-gentxs --home "${DATA_DIR}"

# start the daemon
echo ""
echo "=============================================="
echo ""
echo "DevNet configuration complete. To start, run:"
echo ""
echo "${UND_BIN} start --home ${DATA_DIR}"
echo ""
