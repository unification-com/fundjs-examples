import { useState } from 'react';
import { ReactNoSSR } from '@interchain-ui/react-no-ssr';
import { Layout, Wallet } from '@/components';
import { defaultChainName } from 'config/defaults'
import {StreamList} from "@/components/streams";

export default function Home() {
  const [chainName, setChainName] = useState(defaultChainName);

  function onChainChange(chainName?: string) {
    setChainName(chainName!);
  }

  return (
    <Layout>
      <ReactNoSSR>
        <Wallet chainName={chainName} onChainChange={onChainChange} />
        <StreamList chainName={chainName} />
      </ReactNoSSR>
    </Layout>
  );
}
