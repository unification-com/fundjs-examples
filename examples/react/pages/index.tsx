import { useState } from 'react';
import { ReactNoSSR } from '@interchain-ui/react-no-ssr';
import { Layout, Wallet } from '@/components';
import { defaultChainName } from 'config/defaults'
import {Streams} from "@/components/streams";

export default function Home() {
  const [chainName, setChainName] = useState(defaultChainName);

  function onChainChange(chainName?: string) {
    setChainName(chainName!);
  }

  return (
    <Layout>
      <ReactNoSSR>
        <Wallet chainName={chainName} onChainChange={onChainChange} />
        <Streams chainName={chainName} />
      </ReactNoSSR>
    </Layout>
  );
}
