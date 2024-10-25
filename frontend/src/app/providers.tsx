'use client'

import * as React from 'react';
import { WagmiConfig, createConfig } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import { ConnectKitProvider, getDefaultConfig } from 'connectkit';
import { http } from 'viem';

const config = createConfig(
  getDefaultConfig({
    // App Info
    appName: 'Confidential Data Exchange',
    
    // Alchemy not directly supported in newer versions
    // Use transport instead
    transports: {
      [mainnet.id]: http(`https://eth-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_ID}`),
      [sepolia.id]: http(`https://eth-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_ID}`),
    },

    // WalletConnect
    walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',

    // Chains
    chains: [mainnet, sepolia],
  })
);

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <WagmiConfig config={config}>
      <ConnectKitProvider>
     
      </ConnectKitProvider>
    </WagmiConfig>
  );
}

export default Providers;