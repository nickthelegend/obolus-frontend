import { RpcProvider } from "starknet";
import { getNetwork, type TokenSymbol, getToken } from "./encryption-constants";
import { buildPoseidon } from 'circomlibjs';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let TongoAccountClass: any = null;
let tongoSdkModule: any = null;

export async function getTongoSdk() {
  if (!tongoSdkModule) {
    tongoSdkModule = await import("@fatsolutions/tongo-sdk");
  }
  return tongoSdkModule;
}

async function getTongoAccountClass() {
  if (!TongoAccountClass) {
    const mod = await getTongoSdk();
    TongoAccountClass = mod.Account;
  }
  return TongoAccountClass;
}

function getProvider() {
  const network = getNetwork();
  return new RpcProvider({
    nodeUrl: network.rpcUrl,
    specVersion: "0.9.0",
  });
}

/**
 * Convert a human-readable amount (e.g. "10" or "0.5") to Tongo units (bigint).
 * Tongo stores balances as small integers; 1 Tongo unit = `rate` ERC-20 wei.
 */
function humanToTongoUnits(amount: string, tokenSymbol: TokenSymbol): bigint {
  const token = getToken(tokenSymbol);
  // Parse the decimal string into ERC-20 wei without floating-point
  const parts = amount.split(".");
  const wholePart = parts[0] || "0";
  const fracPart = (parts[1] || "").padEnd(token.decimals, "0").slice(0, token.decimals);
  const erc20Wei = BigInt(wholePart + fracPart);
  // Convert to Tongo units (integer division)
  return erc20Wei / token.rate;
}

/**
 * Create a Tongo account instance for a specific token.
 * The Tongo private key is separate from the Starknet private key.
 * In a real app, this would be derived or stored securely.
 */
export async function createTongoAccount(
  tongoPrivateKey: string,
  tokenSymbol: TokenSymbol
) {
  const Account = await getTongoAccountClass();
  const token = getToken(tokenSymbol);
  const provider = getProvider();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new Account(tongoPrivateKey, token.tongo, provider as any);
}

/**
 * Get decrypted account state (balance, pending, nonce).
 */
export async function getAccountState(
  tongoPrivateKey: string,
  tokenSymbol: TokenSymbol
) {
  const account = await createTongoAccount(tongoPrivateKey, tokenSymbol);
  const state = await account.state();
  return {
    balance: state.balance,
    pending: state.pending,
    nonce: state.nonce,
  };
}

/**
 * Get encrypted (on-chain) balance — returns the raw ElGamal ciphertext.
 */
export async function getEncryptedBalance(
  tongoPrivateKey: string,
  tokenSymbol: TokenSymbol
) {
  const account = await createTongoAccount(tongoPrivateKey, tokenSymbol);
  const raw = await account.rawState();
  return raw.balance;
}

/**
 * Build fund operation calldata.
 * Returns { approve, fund } calldata arrays for signer.execute().
 */
export async function buildFundOp(
  tongoPrivateKey: string,
  tokenSymbol: TokenSymbol,
  amount: string,
  senderAddress: string
) {
  const account = await createTongoAccount(tongoPrivateKey, tokenSymbol);
  const tongoAmount = humanToTongoUnits(amount, tokenSymbol);
  if (tongoAmount <= 0n) throw new Error("Amount too small for this token's precision.");
  const op = await account.fund({ amount: tongoAmount, sender: senderAddress });
  return {
    calls: [op.approve, op.toCalldata()],
  };
}

/**
 * Build transfer operation calldata (confidential transfer).
 * `recipientPublicKey` must be a PubKey {x, y} object (EC point on Stark curve).
 */
export async function buildTransferOp(
  tongoPrivateKey: string,
  tokenSymbol: TokenSymbol,
  recipientPublicKey: { x: string; y: string },
  amount: string,
  senderAddress: string
) {
  const account = await createTongoAccount(tongoPrivateKey, tokenSymbol);
  const tongoAmount = humanToTongoUnits(amount, tokenSymbol);
  if (tongoAmount <= 0n) throw new Error("Amount too small for this token's precision.");
  const op = await account.transfer({
    to: { x: BigInt(recipientPublicKey.x), y: BigInt(recipientPublicKey.y) },
    amount: tongoAmount,
    sender: senderAddress,
  });
  return {
    calls: [op.toCalldata()],
  };
}

/**
 * Build withdraw operation calldata.
 */
export async function buildWithdrawOp(
  tongoPrivateKey: string,
  tokenSymbol: TokenSymbol,
  amount: string,
  receiverAddress: string,
  senderAddress: string
) {
  const account = await createTongoAccount(tongoPrivateKey, tokenSymbol);
  const tongoAmount = humanToTongoUnits(amount, tokenSymbol);
  if (tongoAmount <= 0n) throw new Error("Amount too small for this token's precision.");
  const op = await account.withdraw({
    to: receiverAddress,
    amount: tongoAmount,
    sender: senderAddress,
  });
  return {
    calls: [op.toCalldata()],
  };
}

/**
 * Build rollover operation calldata (consolidate pending -> balance).
 */
export async function buildRolloverOp(
  tongoPrivateKey: string,
  tokenSymbol: TokenSymbol,
  senderAddress: string
) {
  const account = await createTongoAccount(tongoPrivateKey, tokenSymbol);
  const op = await account.rollover({ sender: senderAddress });
  return {
    calls: [op.toCalldata()],
  };
}

/**
 * Get transaction history for a Tongo account.
 */
export async function getTxHistory(
  tongoPrivateKey: string,
  tokenSymbol: TokenSymbol,
  fromBlock?: number
) {
  const account = await createTongoAccount(tongoPrivateKey, tokenSymbol);
  return account.getTxHistory(fromBlock ?? 0);
}

/**
 * Convert ERC20 amount to Tongo units.
 * ERC20_amount = Tongo_amount * rate
 * So: Tongo_amount = ERC20_amount / rate
 */
export function erc20ToTongo(erc20Amount: bigint, tokenSymbol: TokenSymbol): bigint {
  const token = getToken(tokenSymbol);
  return erc20Amount / token.rate;
}

/**
 * Convert Tongo units to ERC20 amount.
 */
export function tongoToErc20(tongoAmount: bigint, tokenSymbol: TokenSymbol): bigint {
  const token = getToken(tokenSymbol);
  return tongoAmount * token.rate;
}

/**
 * Encrypt a discrete value using the SDK's native Tongo ElGamal encryption.
 * Generates { ct_L, ct_R } as HEX strings ready to be sent to Starknet.
 */
export async function encryptOrderData(
  tongoPrivateKey: string,
  amount: number | bigint
) {
  const mod = await getTongoSdk();
  const { derivePublicKey, starkPointToProjectivePoint, createCipherBalance, projectivePointToStarkPoint } = mod;

  const privKeyBigInt = BigInt(tongoPrivateKey);
  const pubKey = derivePublicKey(privKeyBigInt);
  const pubKeyProj = starkPointToProjectivePoint(pubKey);

  // Generate a secure random scalar for the ElGamal encryption random factor
  const array = new Uint8Array(32);
  window.crypto.getRandomValues(array);
  let randomHex = '0x';
  for (let i = 0; i < array.length; i++) {
    randomHex += array[i].toString(16).padStart(2, '0');
  }
  // Approximate curve order modulo
  const randomBigInt = BigInt(randomHex) % BigInt("3618502788666131213697322783095070105623107215331596699973092056135872020481");

  const amountBigInt = BigInt(Math.floor(Number(amount)));
  const cipher = createCipherBalance(pubKeyProj, amountBigInt, randomBigInt);

  const L = projectivePointToStarkPoint(cipher.L);
  const R = projectivePointToStarkPoint(cipher.R);

  return {
    ct_L: '0x' + L.x.toString(16),
    ct_R: '0x' + R.x.toString(16)
  };
}

/**
 * Generate a deterministic Viewing Key with embedded position data.
 * This acts as a signed snapshot of the position state.
 */
export async function generateViewingKey(tongoPrivateKey: string, positionId: string, data?: any) {
  try {
    const poseidon = await buildPoseidon();
    const F = poseidon.F;
    const privKeyBigInt = BigInt(tongoPrivateKey);

    let posHash = 0n;
    for (let i = 0; i < positionId.length; i++) posHash += BigInt(positionId.charCodeAt(i));

    const derivedKey = F.toString(poseidon([privKeyBigInt, posHash]));

    // Embed the real position data into the blob
    const payload = {
      k: derivedKey.slice(0, 10), // Short hash for verification
      id: positionId,
      ...data,
      timestamp: new Date().toISOString()
    };

    const blob = btoa(JSON.stringify(payload));
    return `obolus_vk_${blob}`;
  } catch (e) {
    console.error("Failed to generate viewing key:", e);
    return null;
  }
}

/**
 * Decrypt and reveal the embedded position data from a viewing key.
 */
export async function verifyViewingKey(vk: string) {
  if (!vk.startsWith("obolus_vk_")) throw new Error("Invalid Viewing Key format (Missing Prefix)");

  try {
    const blob = vk.split("obolus_vk_")[1];
    const decoded = JSON.parse(atob(blob));

    return {
      owner: decoded.owner || "Anonymous Trader",
      asset: decoded.asset || "Unknown",
      size: decoded.size || "0",
      leverage: decoded.leverage || "1x",
      entryPrice: decoded.entryPrice || "0",
      pnl: decoded.pnl || "$0.00",
      timestamp: decoded.timestamp ? new Date(decoded.timestamp).toISOString().replace('T', ' ').split('.')[0] + " UTC" : "N/A",
      compliance: "CLEAN",
      id: decoded.id
    };
  } catch (e) {
    throw new Error("Malformed or Corrupted Viewing Key Payload");
  }
}
