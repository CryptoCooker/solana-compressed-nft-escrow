# cnft-escrow

This repository contains the cnft-escrow program, a Solana Anchor program that allows you to deposit and withdraw compressed NFTs (cNFTs) on Pda of program. The program interacts with the Metaplex Bubblegum program through CPI to transfer cNFTs.

## Components

- programs: Contains the anchor program
- tests: Contains the tests for the anchor program

## Deployment

The program is deployed on devnet at `9PXknQSJw9Roe3xrogPW8pr1ztNFcBiJbFzEz8EyFEN6`. You can deploy it yourself by changing the respective values in lib.rs and Anchor.toml.

## How to run

1. Configure RPC path in cnft-escrow.ts. Personal preference: Helius RPCs.
2. run `anchor build` at the root of the project i.e cnft-escrow in this case.
3. run `anchor deploy` to deploy and test the program on your own cluster.
4. run `anchor test` to run the tests.
