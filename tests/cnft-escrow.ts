import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { CnftEscrow } from "../target/types/cnft_escrow";
import { PROGRAM_ID as BUBBLEGUM_PROGRAM_ID } from "@metaplex-foundation/mpl-bubblegum";
import { decode, mapProof } from "./utils";
import { getAsset, getAssetProof } from "./readApi";
import { createAndMint } from "./createAndMint";
import { getcNFTsFromCollection } from "./fetchNFTsByCollection";
import {
  SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
  SPL_NOOP_PROGRAM_ID,
} from "@solana/spl-account-compression";
import { explorerURL } from "./utils/helpers";

// Replace this with your custom RPC endpoint
export const RPC_PATH = "https://api.devnet.solana.com";

describe("cnft-escrow", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.CnftEscrow as Program<CnftEscrow>;
  const provider = anchor.AnchorProvider.env();
  const payerWallet = provider.wallet as anchor.Wallet;

  let treeAddress: anchor.web3.PublicKey | undefined = undefined;
  const MPL_BUBBLEGUM_PROGRAM_ID_KEY = new anchor.web3.PublicKey(
    BUBBLEGUM_PROGRAM_ID
  );

  // this is the assetId of the cNft
  let assetId: string = "";

  it("Should create the tree and mint a cnft", async () => {
    const { tree, collection } = await createAndMint();
    if (!tree.treeAddress) {
      throw new Error("Tree address not found");
    }
    treeAddress = tree.treeAddress;

    const fetchcNFTs = await getcNFTsFromCollection(
      collection.mint,
      payerWallet.publicKey.toString()
    );
    console.log("fetchcNFTs", fetchcNFTs);
    assetId = fetchcNFTs[0];
  });

  it("Deposit cNft!", async () => {
    const asset = await getAsset(assetId);

    const merkleTree = new anchor.web3.PublicKey(asset.compression.tree);
    const proof = await getAssetProof(assetId);
    const proofPathAsAccounts = await mapProof(proof, merkleTree, program.provider.connection);
    const root = decode(proof.root);
    const dataHash = decode(asset.compression.data_hash);
    const creatorHash = decode(asset.compression.creator_hash);
    const nonce = new anchor.BN(asset.compression.leaf_id);
    const index = asset.compression.leaf_id;
    const leafDelegate = new anchor.web3.PublicKey(asset.ownership.delegated ? asset.ownership.delegate : asset.ownership.owner)
    const [treeAuthority, _bump2] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [treeAddress.toBuffer()],
        MPL_BUBBLEGUM_PROGRAM_ID_KEY
      );
    const [escrowVault] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from('VAULT_TAG')],
        program.programId
      );
    const tx = await program.methods
      .depositCnft(root, dataHash, creatorHash, nonce, index)
      .accounts({
        authority: payerWallet.publicKey,
        escrowVault,
        treeAuthority: treeAuthority,
        leafDelegate,
        merkleTree: treeAddress,
        logWrapper: SPL_NOOP_PROGRAM_ID,
        compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
        bubblegumProgram: BUBBLEGUM_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .remainingAccounts(proofPathAsAccounts)
      .rpc({
        skipPreflight: true,
      });
    console.log(" ✅ - Deposit Cnft success.");
    console.log(explorerURL({ txSignature: tx }));
    // example signature: https://explorer.solana.com/tx/54VoKAea212GZz6wXaSz1Deo72YUfJ5t69W5kTyjS9ZStEs3gqNHwwgbwNCzyFJGhMufea6iyRVfzxm5D5T3vhMz?cluster=devnet
  });

  it("Withdraw cNft!", async () => {
    const asset = await getAsset(assetId);

    const merkleTree = new anchor.web3.PublicKey(asset.compression.tree);
    const proof = await getAssetProof(assetId);
    const proofPathAsAccounts = await mapProof(proof, merkleTree, program.provider.connection);
    const root = decode(proof.root);
    const dataHash = decode(asset.compression.data_hash);
    const creatorHash = decode(asset.compression.creator_hash);
    const nonce = new anchor.BN(asset.compression.leaf_id);
    const index = asset.compression.leaf_id;
    const leafDelegate = new anchor.web3.PublicKey(asset.ownership.delegated ? asset.ownership.delegate : asset.ownership.owner)
    const [treeAuthority, _bump2] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [treeAddress.toBuffer()],
        MPL_BUBBLEGUM_PROGRAM_ID_KEY
      );
    const [escrowVault] =
      anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from('VAULT_TAG')],
        program.programId
      );
    const tx = await program.methods
      .withdrawCnft(root, dataHash, creatorHash, nonce, index)
      .accounts({
        authority: payerWallet.publicKey,
        escrowVault,
        treeAuthority: treeAuthority,
        leafDelegate,
        merkleTree: treeAddress,
        logWrapper: SPL_NOOP_PROGRAM_ID,
        compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
        bubblegumProgram: BUBBLEGUM_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .remainingAccounts(proofPathAsAccounts)
      .rpc({
        skipPreflight: true,
      });
    console.log(" ✅ - Withdraw Cnft success.");
    console.log(explorerURL({ txSignature: tx }));
    // example signature: https://explorer.solana.com/tx/9i9Sutp2yHSwPUwibePa6XFCqwtRT9jYwoE8JV5vH99xkSybLvZahFx4H3Zimkfb47MUqmb8SDpv3RbqtEg9Vso?cluster=devnet
  });
});
