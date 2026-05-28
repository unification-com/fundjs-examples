import {fromBech32} from "@cosmjs/encoding"

const addresses = [
    "und1kk0dtyt6gdvjxd89w6y3604xu77qdh6guhmsqs", // valid
    "cosmos1hufkq9htjd9eyakkf7nlz82ca4lsxgqe5e03ay", // valid bech32, but invalid because cosmos address
    "0x6C80cD134110c004720bAc711D4cA32D5f0dD647",  // invalid - not bech32. Ethereum formatted address
    "und1g68rqj3m3wje4fwefwefwegwergerger",  // invalid - not bech32. Junk address
]

for(let i = 0; i < addresses.length; i+=1) {
    const addr = addresses[i]
    console.log(`Checking ${addr}`)
    try {
        const res = fromBech32(addr)
        if(res.prefix === "und") {
            console.log(`  - Valid Unification wallet`)
        } else {
            console.log(`  - INVALID: expected prefix "und". Got prefix ${res.prefix}`)
        }
    } catch (e) {
        console.log(`  - INVALID: not valid bech32`)
    }
}
