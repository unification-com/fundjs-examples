import Head from 'next/head';
import { Container } from '@interchain-ui/react';
import { Header } from './Header';
import { Footer } from './Footer';

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Container maxWidth="64rem" attributes={{ py: '$14' }}>
      <Head>
        <title>Payment Streams </title>
        <meta name="description" content="Unification Payment Streams" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Header />
      {children}
      <Footer />
    </Container>
  );
}
