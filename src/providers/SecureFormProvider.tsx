import React, {
  createContext, useContext, useEffect, useState, useCallback, ReactNode
} from 'react';
export class WebAuthnError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WebAuthnError';
  }
}

export async function startRegistration(email: string) {
  if (!window.PublicKeyCredential) {
    throw new WebAuthnError('WebAuthn is not supported in this browser');
  }

  // Generate random user ID
  const userId = crypto.getRandomValues(new Uint8Array(16));
  
  // Generate challenge
  const challenge = crypto.getRandomValues(new Uint8Array(32));

  const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
    challenge,
    rp: {
      name: 'Passkey Demo',
      id: window.location.hostname,
    },
    user: {
      id: userId,
      name: email,
      displayName: email,
    },
    pubKeyCredParams: [
      { type: 'public-key', alg: -7 }, // ES256
      { type: 'public-key', alg: -257 }, // RS256
    ],
    timeout: 60000,
    attestation: 'none',
    authenticatorSelection: {
      authenticatorAttachment: 'platform',
      userVerification: 'required',
      residentKey: 'required',
    },
  };

  try {
    const credential = await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions,
    }) as PublicKeyCredential;

    const response = credential.response as AuthenticatorAttestationResponse;
    
    return {
      id: credential.id,
      rawId: bufferToBase64URLString(credential.rawId),
      response: {
        clientDataJSON: bufferToBase64URLString(response.clientDataJSON),
        attestationObject: bufferToBase64URLString(response.attestationObject),
      },
      type: credential.type,
    };
  } catch (error) {
    throw new WebAuthnError(`Failed to create credential: ${error}`);
  }
}

export async function startAuthentication() {
  if (!window.PublicKeyCredential) {
    throw new WebAuthnError('WebAuthn is not supported in this browser');
  }

  const challenge = crypto.getRandomValues(new Uint8Array(32));

  const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
    challenge,
    timeout: 60000,
    userVerification: 'required',
    rpId: window.location.hostname,
  };

  try {
    const assertion = await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions,
    }) as PublicKeyCredential;

    const response = assertion.response as AuthenticatorAssertionResponse;

    return {
      id: assertion.id,
      rawId: bufferToBase64URLString(assertion.rawId),
      response: {
        authenticatorData: bufferToBase64URLString(response.authenticatorData),
        clientDataJSON: bufferToBase64URLString(response.clientDataJSON),
        signature: bufferToBase64URLString(response.signature),
        userHandle: response.userHandle ? bufferToBase64URLString(response.userHandle) : null,
      },
      type: assertion.type,
    };
  } catch (error) {
    throw new WebAuthnError(`Failed to authenticate: ${error}`);
  }
}

export function bufferToBase64URLString(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let str = '';
  
  for (const charCode of bytes) {
    str += String.fromCharCode(charCode);
  }
  
  const base64String = btoa(str);
  
  return base64String
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

export function base64URLStringToBuffer(base64URLString: string): ArrayBuffer {
  const base64 = base64URLString
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  const padLength = (4 - (base64.length % 4)) % 4;
  const padded = base64.padEnd(base64.length + padLength, '=');
  
  const binary = atob(padded);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  
  return buffer;
}

export async function deriveKey(input: ArrayBuffer): Promise<CryptoKey> {
const keyMaterial = await crypto.subtle.importKey(
  'raw',
  input,
  { name: 'PBKDF2' },
  false,
  ['deriveBits', 'deriveKey']
);

return crypto.subtle.deriveKey(
  {
    name: 'PBKDF2',
    salt: new TextEncoder().encode('passkey-demo-salt'),
    iterations: 100000,
    hash: 'SHA-256'
  },
  keyMaterial,
  { name: 'AES-GCM', length: 256 },
  true,
  ['encrypt', 'decrypt']
);
}

export async function encryptData(key: CryptoKey, data: string): Promise<string> {
const iv = crypto.getRandomValues(new Uint8Array(12));
const encodedData = new TextEncoder().encode(data);

const encryptedData = await crypto.subtle.encrypt(
  {
    name: 'AES-GCM',
    iv: iv
  },
  key,
  encodedData
);

const combined = new Uint8Array(iv.length + encryptedData.byteLength);
combined.set(iv);
combined.set(new Uint8Array(encryptedData), iv.length);

return bufferToBase64URLString(combined.buffer);
}

export async function decryptData(key: CryptoKey, encryptedData: string): Promise<string> {
const data = base64URLStringToBuffer(encryptedData);
const iv = data.slice(0, 12);
const ciphertext = data.slice(12);

const decryptedData = await crypto.subtle.decrypt(
  {
    name: 'AES-GCM',
    iv: iv
  },
  key,
  ciphertext
);

return new TextDecoder().decode(decryptedData);
} 

type SecureContext<T> = {
  isAuthenticated : boolean;
  encryptionKey   : CryptoKey | null;
  values          : T | null;
  login           : () => Promise<void>;
  logout          : () => void;
  setValues       : (v:T) => Promise<void>;
};

const Ctx = createContext<SecureContext<any> | undefined>(undefined);

type FallbackRender<T> = (props: {
  submit     : (values:T)=>Promise<void>;
  error?     : string;
  isLoading? : boolean;
}) => ReactNode;

interface Props<T> {
  storageKey        : string;
  fallback          : FallbackRender<T>;
  children          : (ctx: SecureContext<T>) => ReactNode;
}

export function SecureFormProvider<T extends Record<string, unknown>>(
  { storageKey, fallback, children }: Props<T>
){
  const [encryptionKey, setKey] = useState<CryptoKey|null>(null);
  const [values,        setVals] = useState<T|null>(null);
  const [error,         setErr]  = useState<string|null>(null);
  const [isLoading,     setLoad] = useState(false);

  /* ──────────────────────────────────────────────── */
  /*  Helpers                                         */
  /* ──────────────────────────────────────────────── */

  const decryptFromStorage = useCallback(async (key:CryptoKey) => {
    const cipher = localStorage.getItem(`${storageKey}.data`);
    if (!cipher) return null;
    const json   = await decryptData(key, cipher);
    return JSON.parse(json) as T;
  }, [storageKey]);

  const encryptAndStore = useCallback(async (key:CryptoKey, v:T) => {
    const cipher = await encryptData(key, JSON.stringify(v));
    localStorage.setItem(`${storageKey}.data`, cipher);
  }, [storageKey]);

  const deriveAndSetKey = useCallback(async (rawIdBase64:string) => {
    const buf = base64URLStringToBuffer(rawIdBase64);
    const key = await deriveKey(buf);
    setKey(key);
    return key;
  }, []);

  /* ──────────────────────────────────────────────── */
  /*  Auto‑login on mount                             */
  /* ──────────────────────────────────────────────── */

  useEffect(() => {
    const auto = async () => {
      const id = localStorage.getItem('userIdentifier');
      const hasBlob = !!localStorage.getItem(`${storageKey}.data`);
      if (!id || !hasBlob) return;

      setLoad(true);
      try {
        const assertion = await startAuthentication();
        const key = await deriveAndSetKey(assertion.rawId);
        const v = await decryptFromStorage(key);
        setVals(v);
      } catch (e){ console.error('[SecureForm] auto‑login failed', e); }
      finally     { setLoad(false); }
    };
    auto();
  }, [storageKey, decryptFromStorage, deriveAndSetKey]);

  /* ──────────────────────────────────────────────── */
  /*  Public API                                      */
  /* ──────────────────────────────────────────────── */

  const login = useCallback(async () => {
    setLoad(true); setErr(null);
    try {
      const assertion = await startAuthentication();
      const key = await deriveAndSetKey(assertion.rawId);
      const v   = await decryptFromStorage(key);
      setVals(v);
    } catch(e:any){ setErr(e.message || 'Login failed'); throw e; }
    finally      { setLoad(false); }
  }, [decryptFromStorage, deriveAndSetKey]);

  const logout = useCallback(() => {
    setKey(null);
    setVals(null);
    setErr(null);
  }, []);

  const setValues = useCallback(async (v:T) => {
    if (!encryptionKey) throw new Error('Not authenticated');
    await encryptAndStore(encryptionKey, v);
    setVals(v);
  }, [encryptAndStore, encryptionKey]);

  /* ──────────────────────────────────────────────── */
  /*  Fallback submit handler                         */
  /* ──────────────────────────────────────────────── */

  const submit = useCallback(async (formVals:T) => {
    setLoad(true); setErr(null);
    try {
      let key = encryptionKey;
      if (!key){
        // first‑time user? → register
        const cred = await startRegistration(storageKey);
        key = await deriveAndSetKey(cred.rawId);
        localStorage.setItem('userIdentifier', cred.rawId);
      }
      await encryptAndStore(key!, formVals);
      setVals(formVals);
    } catch(e: unknown){ setErr(e instanceof Error ? e.message : 'Failed to save'); throw e; }
    finally      { setLoad(false); }
  }, [encryptionKey, deriveAndSetKey, encryptAndStore]);

  const ctxValue: SecureContext<T> = {
    isAuthenticated : !!encryptionKey,
    encryptionKey,
    values,
    login,
    logout,
    setValues,
  };

  /* ──────────────────────────────────────────────── */
  /*  Render                                          */
  /* ──────────────────────────────────────────────── */

  const needFallback = !encryptionKey || values === null;

  return (
    <Ctx.Provider value={ctxValue}>
      {needFallback
        ? fallback({ submit, error: error || undefined, isLoading })
        : children(ctxValue)}
    </Ctx.Provider>
  );
}

/* Hook for consumers */
export const useSecureForm = <T,>() => {
  const c = useContext(Ctx);
  if (!c) throw new Error('useSecureForm must be inside SecureFormProvider');
  return c as SecureContext<T>;
}; 