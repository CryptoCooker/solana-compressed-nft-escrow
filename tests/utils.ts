import {
  Connection,
  Keypair,
  PublicKey,
  Signer,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
  AccountMeta,
} from "@solana/web3.js";

import {
  ConcurrentMerkleTreeAccount,
} from "@solana/spl-account-compression";

import * as bs58 from "bs58";

export function loadWalletKey(keypairFile: string): Keypair {
  const fs = require("fs");
  return Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(fs.readFileSync(keypairFile).toString()))
  );
}

export function decode(stuff: string) {
  return bufferToArray(bs58.decode(stuff));
}
function bufferToArray(buffer: Buffer): number[] {
  const nums: number[] = [];
  for (let i = 0; i < buffer.length; i++) {
    nums.push(buffer[i]);
  }
  return nums;
}
export const mapProof = async (assetProof: { proof: string[] }, treeAddress: PublicKey, connection: Connection): Promise<AccountMeta[]> => {
  if (!assetProof.proof || assetProof.proof.length === 0) {
    throw new Error("Proof is empty");
  }
  const treeAccount = await ConcurrentMerkleTreeAccount.fromAccountAddress(connection, treeAddress);
  
  const treeAuthority = treeAccount.getAuthority();
  const canopyDepth = treeAccount.getCanopyDepth();
  return assetProof.proof.map((node) => ({
    pubkey: new PublicKey(node),
    isSigner: false,
    isWritable: false,
  })).slice(0, assetProof.proof.length - (!!canopyDepth ? canopyDepth : 0));
};
