import nacl from "tweetnacl";
import { encodeBase64, decodeBase64, decodeUTF8, encodeUTF8 } from "tweetnacl-util";
import { StrKey } from "@stellar/stellar-sdk";

const NONCE_LENGTH = nacl.box.nonceLength;

function getLowlevel() {
  return (nacl as unknown as { lowlevel: Record<string, unknown> }).lowlevel;
}

function ed25519PkToCurve25519(edPk: Uint8Array): Uint8Array {
  const curvePk = new Uint8Array(32);
  const ll = getLowlevel();
  const fn = ll.crypto_sign_ed25519_pk_to_curve25519 as (pk: Uint8Array, curvePk: Uint8Array) => void;
  fn(edPk, curvePk);
  return curvePk;
}

function ed25519SkToCurve25519(edSk: Uint8Array): Uint8Array {
  const curveSk = new Uint8Array(32);
  const ll = getLowlevel();
  const fn = ll.crypto_sign_ed25519_sk_to_curve25519 as (sk: Uint8Array, curveSk: Uint8Array) => void;
  fn(edSk, curveSk);
  return curveSk;
}

function stellarPubToNacl(stellarPubKey: string): Uint8Array {
  try {
    const raw = StrKey.decodeEd25519PublicKey(stellarPubKey);
    return ed25519PkToCurve25519(raw);
  } catch {
    throw new Error("Invalid Stellar public key");
  }
}

function stellarSecToNacl(stellarSecretKey: string): Uint8Array {
  try {
    const raw = StrKey.decodeEd25519SecretSeed(stellarSecretKey);
    return ed25519SkToCurve25519(raw);
  } catch {
    throw new Error("Invalid Stellar secret key");
  }
}

function encodePayload(nonce: Uint8Array, ciphertext: Uint8Array, ephemeralPubKey: Uint8Array): string {
  const combined = new Uint8Array(NONCE_LENGTH + ciphertext.length + ephemeralPubKey.length);
  combined.set(nonce);
  combined.set(ciphertext, NONCE_LENGTH);
  combined.set(ephemeralPubKey, NONCE_LENGTH + ciphertext.length);
  return encodeBase64(combined);
}

export interface EncryptedPayload {
  nonce: string;
  ciphertext: string;
  ephemeralPubKey: string;
}

function decodePayload(encoded: string): EncryptedPayload {
  const combined = decodeBase64(encoded);
  const nonce = combined.slice(0, NONCE_LENGTH);
  const ephemeralPubKey = combined.slice(combined.length - nacl.box.publicKeyLength);
  const ciphertext = combined.slice(NONCE_LENGTH, combined.length - nacl.box.publicKeyLength);
  return {
    nonce: encodeBase64(nonce),
    ciphertext: encodeBase64(ciphertext),
    ephemeralPubKey: encodeBase64(ephemeralPubKey),
  };
}

export function encryptMessage(message: string, recipientPubKey: string): string {
  const recipientKey = stellarPubToNacl(recipientPubKey);
  const ephemeral = nacl.box.keyPair();
  const nonce = nacl.randomBytes(NONCE_LENGTH);
  const messageBytes = decodeUTF8(message);
  const ciphertext = nacl.box(messageBytes, nonce, recipientKey, ephemeral.secretKey);

  if (!ciphertext) {
    throw new Error("Encryption failed");
  }

  return encodePayload(nonce, ciphertext, ephemeral.publicKey);
}

export function decryptMessage(encrypted: string, secretKey: string): string {
  const parsed = decodePayload(encrypted);
  const nonce = decodeBase64(parsed.nonce);
  const ciphertext = decodeBase64(parsed.ciphertext);
  const ephemeralPubKey = decodeBase64(parsed.ephemeralPubKey);
  const secretKeyBytes = stellarSecToNacl(secretKey);

  const decrypted = nacl.box.open(ciphertext, nonce, ephemeralPubKey, secretKeyBytes);

  if (!decrypted) {
    throw new Error("Decryption failed");
  }

  return encodeUTF8(decrypted);
}

export function isEncryptedMessage(message: string): boolean {
  if (!message || message.length < 100) return false;
  try {
    const parsed = decodePayload(message);
    return !!(parsed.nonce && parsed.ciphertext && parsed.ephemeralPubKey);
  } catch {
    return false;
  }
}
