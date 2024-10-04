import {Link} from "@interchain-ui/react";
import {getExplorer, truncateAddress} from "@/utils";
import React from "react";

export type ExplorerLinkProps = {
    value: string,
    what: string,
    truncate: boolean,
    chainName: string,
}

export const ExplorerLink = ({ value, what, truncate, chainName }: ExplorerLinkProps) => {

    const explorer = getExplorer(chainName);

    let url = "";
    let len = 16;
    switch (what) {
        case "account":
            if (explorer.account_page !== undefined && value != null) {
                url = explorer.account_page.replace("${accountAddress}", value);
            }
            len = 16;
            break;
        case "tx":
            if (explorer.tx_page !== undefined && value != null) {
                url = explorer.tx_page.replace("${txHash}", value);
            }
            len = 12;
            break;
    }

    if (url !== "") {
        return (
            <Link href={url} target={"_blank"}>
                {truncate ? truncateAddress(value, len) : value}
            </Link>
        );
    }
    return <>{value}</>;
}
