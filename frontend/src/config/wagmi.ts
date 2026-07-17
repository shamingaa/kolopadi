import { createConfig, http } from "wagmi";
import { injected, walletConnect } from "wagmi/connectors";
import { monadTestnet } from "./chain";

// WalletConnect project IDs are public identifiers (they tell the relay
// network which app is connecting), not secrets - safe to commit, same as
// the contract address elsewhere in this config folder.
const WALLETCONNECT_PROJECT_ID = "d010afd86ba9ea03a8ac9daa6fa49643";

// Two ways to connect: `injected` covers desktop browser extensions and a
// wallet app's own in-app browser (both inject window.ethereum the same
// way). `walletConnect` covers everyone else on mobile - a plain phone
// browser has no injected wallet at all, so it needs a QR/deep-link
// handoff to whatever wallet app the user has installed.
export const wagmiConfig = createConfig({
  chains: [monadTestnet],
  connectors: [
    injected(),
    walletConnect({
      projectId: WALLETCONNECT_PROJECT_ID,
      metadata: {
        name: "KoloPadi",
        description: "An onchain kolo you can't sneak into, with a padi who can catch you if you slip.",
        url: "https://kolopadi.vercel.app",
        icons: ["https://kolopadi.vercel.app/favicon.svg"],
      },
    }),
  ],
  transports: {
    [monadTestnet.id]: http(),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
