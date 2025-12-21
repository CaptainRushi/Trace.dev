import { encode as base64Encode, decode as base64Decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

async function getKey(): Promise<CryptoKey> {
    const secret = Deno.env.get('ENCRYPTION_KEY');
    if (!secret) {
        throw new Error('Missing ENCRYPTION_KEY environment variable');
    }
    // Assume secret is a 32-byte hex string or high-entropy string
    // For simplicity, we import it as raw key material.
    // Ideally, use a proper KDF or a 32-byte hex string.
    // We'll assume it's a 64-char hex string (32 bytes).

    // If it's just a random string, let's digest it to ensure 256 bits for AES-GCM
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        encoder.encode(secret),
        { name: "PBKDF2" },
        false,
        ["deriveKey"]
    );

    return crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: encoder.encode("salt_trace_dev_backend"), // Fixed salt for determinstic key from env
            iterations: 100000,
            hash: "SHA-256",
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    );
}

export async function encrypt(text: string): Promise<string> {
    const key = await getKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    const encoded = encoder.encode(text);

    const ciphertext = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        key,
        encoded
    );

    // Return IV + Ciphertext as base64
    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(ciphertext), iv.length);

    return base64Encode(combined);
}

export async function decrypt(encryptedBase64: string): Promise<string> {
    const key = await getKey();
    const combined = base64Decode(encryptedBase64);

    const iv = combined.slice(0, 12);
    const data = combined.slice(12);

    const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv },
        key,
        data
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
}
