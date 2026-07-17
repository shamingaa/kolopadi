# KoloPadi

An onchain kolo you can't sneak into, with a padi who can catch you if you slip.

- **Kolo**: a traditional Nigerian clay piggy bank. You break it open when it's full; there's no other way in.
- **Padi**: pidgin for "friend." The person you trust enough to hand a stick with.

Built for the [Spark hackathon](https://buildanything.so/hackathons/spark) on BuildAnything.

**Live app:** [kolopadi.vercel.app](https://kolopadi.vercel.app/)

## The problem

Money sitting in a hot wallet doesn't survive impulse spending. It's one tap away from being swapped, sent, or spent on something that isn't the thing you were actually saving for. The physical kolo solved this generations ago with a dumb but effective trick: make the money hard to reach, and make breaking the seal a visible, deliberate act instead of a casual one. KoloPadi is that same trick, onchain, except now the "seal" is a smart contract, and the accountability comes from a friend who can watch your commitment and call you out the moment you miss it.

## How it works

1. **Create a kolo.** Commit to depositing a fixed amount of MON every epoch, for a set number of epochs, and name a padi: a friend's wallet address. Your first deposit happens in the same transaction, so a kolo never exists with zero money in it.
2. **Feed it every epoch.** The deposit *is* the check-in. There's no separate "I showed up" button; the chain only believes MON that actually moved. Because you can only ever deposit for the current epoch, there's no way to retroactively cover a day you missed.
3. **Miss an epoch, and your padi can catch you.** `slashMiss()` lets your padi claim 2% of the current pot as a bounty for any epoch you genuinely missed and haven't been caught on yet, one catch per missed epoch, ever. This is opportunistic, not automatic enforcement: if your padi isn't paying attention, nothing forces the penalty. It's a nagging incentive, not a cage.
4. **Break it early if you need to.** `breakKolo()` gives you 90% of the pot back and sends your padi 10%. Funds are never permanently trapped; that's the whole point of an escape hatch.
5. **Finish the full duration, and it's all yours.** `claim()` returns 100% of whatever you saved, once every epoch of the committed duration has elapsed.

## Why "demo mode" exists

An epoch is configurable down to 60 seconds specifically so a full create, deposit, miss, slash, and claim lifecycle can be watched live in a few minutes, instead of requiring days of real waiting. "Real mode" (24h epochs) is the actual intended use; "Demo mode" (60s epochs) exists purely so judges can see the whole thing happen without taking anything on faith. The frontend labels which mode you're in. Nothing about the data is faked either way; every deposit, miss, and claim in demo mode is a genuine transaction on Monad testnet.

## Architecture

```
kolopadi/
├── src/KoloPadi.sol          # The contract, single file, no external dependencies
├── test/KoloPadi.t.sol       # 28 Foundry tests
├── script/DeployKoloPadi.s.sol
├── deployments/monad-testnet.json   # Deployed address + network config
└── frontend/                 # Vite + React + TypeScript + wagmi + viem
    └── src/
        ├── screens/           # Home (My Kolo), CreateKolo, PadiView
        ├── components/        # KoloPot illustration, dialogs, wallet UI
        ├── hooks/             # Contract reads/writes, wallet resync
        └── config/            # Monad testnet chain + contract config
```

The contract holds one `Kolo` struct per savings pot (owner, padi, deposit amount, epoch length, duration, timestamps, running totals, status), with per-epoch deposit/slash tracking kept in separate top-level mappings. Solidity won't let a struct containing a mapping be returned to a caller, so the per-epoch detail lives outside it. Every state-changing function follows checks-effects-interactions with a hand-rolled reentrancy guard, and uses custom errors instead of string reverts. No OpenZeppelin or other external dependency; the whole thing is one file.

The frontend never shows placeholder data. Every number on screen is a live contract read; every button triggers a real transaction and waits for on-chain confirmation (and correctly detects a *reverted* transaction as a failure, not a success) before updating.

## Deployment

- **App:** [kolopadi.vercel.app](https://kolopadi.vercel.app/)
- **Network:** Monad Testnet (chain id `10143`)
- **Contract:** [`0xa8192d2632Ede7EF89ccfe88B4c86F5Ba190d2a4`](https://testnet.monadvision.com/address/0xa8192d2632Ede7EF89ccfe88B4c86F5Ba190d2a4)
- **Verified:** yes, via Sourcify/MonadVision (exact source match)

## Local setup

### Contract

```bash
forge build
forge test          # 28 tests
```

To redeploy or verify:

```bash
cp .env.example .env   # fill in PRIVATE_KEY (funded from https://faucet.monad.xyz) and MONAD_TESTNET_RPC_URL
forge script script/DeployKoloPadi.s.sol:DeployKoloPadi --rpc-url monad_testnet --broadcast
forge verify-contract <address> src/KoloPadi.sol:KoloPadi --chain 10143 --verifier sourcify --verifier-url https://sourcify-api-monad.blockvision.org/
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Requires MetaMask (or another injected wallet) added to Monad Testnet:

| Field | Value |
|---|---|
| Network Name | Monad Testnet |
| RPC URL | `https://testnet-rpc.monad.xyz` |
| Chain ID | `10143` |
| Currency Symbol | `MON` |
| Explorer | `https://testnet.monadvision.com` |

Get testnet MON from the [faucet](https://faucet.monad.xyz).

## Future work

**A second commitment type: "no impulse trading" stakes.** Instead of a recurring deposit schedule, you'd lock a lump sum against a promise not to touch a specific asset or wallet for a set period. If your padi believes you broke the promise, they'd open a dispute by submitting a transaction hash as evidence. The contract wouldn't verify the claim's substance onchain (that's inherently subjective), but would put the stake in a challenge window where the padi's evidence is visible and the owner can respond before any slash executes. This isn't built; the trust model and dispute-resolution design need real thought before writing a line of it, but the discipline-via-a-friend mechanic clearly generalizes past pure savings.
