import type { AppProps } from 'next/app';
import { SignerOptions, wallets } from 'cosmos-kit';
import { ChainProvider } from '@cosmos-kit/react';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import {
  Box,
  ThemeProvider,
  Toaster,
  useTheme,
  useColorModeValue,
} from '@interchain-ui/react';
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { chains, assets } from '../config/chains';

import { aminoTypes, registry } from '../config/defaults';

import '@interchain-ui/react/styles';
import '@interchain-ui/react/globalStyles';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

function CreateCosmosApp({ Component, pageProps }: AppProps) {
  const { themeClass } = useTheme();

  // Include the Mainchain, Cosmos and IBC proto registry and amino convertors
  // defined in ../config/defaults. This enables the application to sign Txs
  // containing those Msg types.
  const signerOptions: SignerOptions = {
    // @ts-ignore
    signingStargate: () => {
      return {
        aminoTypes,
        registry,
      };
    },
  };

  return (
    <ThemeProvider>
      <ChainProvider
        chains={chains}
        assetLists={assets}
        wallets={wallets}
        walletConnectOptions={{
          signClient: {
            projectId: 'a8510432ebb71e6948cfd6cde54b70f7',
            relayUrl: 'wss://relay.walletconnect.org',
            metadata: {
              name: 'Cosmos Kit dApp',
              description: 'Cosmos Kit dApp built by Create Cosmos App',
              url: 'https://docs.cosmoskit.com/',
              icons: [],
            },
          },
        }}
        signerOptions={signerOptions}
      >
        <QueryClientProvider client={queryClient}>
          <Box
            className={themeClass}
            minHeight="100dvh"
            backgroundColor={useColorModeValue('$white', '$background')}
          >
            {/* TODO fix type error */}
            {/* @ts-ignore */}
            <Component {...pageProps} />
          </Box>
        </QueryClientProvider>
      </ChainProvider>

      <Toaster position={'top-right'} closeButton={true} />
    </ThemeProvider>
  );
}

export default CreateCosmosApp;
