import crypto from "node:crypto";

export const ED25519_SIGNATURE_ALGORITHM = "ed25519";
export const SIGNED_CONSENT_RECEIPT_TOP_LEVEL_FIELDS = new Set([
  "schema_version",
  "status",
  "signer_alias",
  "signer_identity_hash",
  "consent_record_ids",
  "consent_form",
  "confirmed_consent_flags",
  "signed_at",
  "signed_by",
  "signature_evidence",
]);

export function sha256Text(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

export function sha256Bytes(bytes) {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

export function stableJson(value) {
  if (value === undefined) return "null";
  if (Array.isArray(value)) return `[${value.map((item) => stableJson(item)).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

export function canonicalSignedConsentReceiptPayload(receipt) {
  const consentRecordIds = Array.isArray(receipt.consent_record_ids)
    ? receipt.consent_record_ids
      .filter((value) => typeof value === "string")
      .sort()
    : [];
  return stableJson({
    schema_version: receipt.schema_version,
    status: receipt.status,
    signer_alias: receipt.signer_alias,
    signer_identity_hash: receipt.signer_identity_hash,
    consent_record_ids: consentRecordIds,
    consent_form: receipt.consent_form,
    confirmed_consent_flags: receipt.confirmed_consent_flags,
    signed_at: receipt.signed_at,
    signed_by: receipt.signed_by,
  });
}

export function validateSignedConsentReceiptTopLevelFields(receipt, context) {
  const findings = [];
  if (!receipt || typeof receipt !== "object" || Array.isArray(receipt)) {
    return [`${context} must be an object`];
  }
  for (const key of Object.keys(receipt)) {
    if (!SIGNED_CONSENT_RECEIPT_TOP_LEVEL_FIELDS.has(key)) {
      findings.push(`${context} contains unexpected unsigned field: ${key}`);
    }
  }
  return findings;
}

export function validateEd25519SignatureEvidence({ signedObject, payload, context }) {
  const findings = [];
  const signature = signedObject?.signature_evidence;
  if (!signature || typeof signature !== "object" || Array.isArray(signature)) {
    findings.push(`${context}.signature_evidence must be an object`);
    return findings;
  }
  if (signature.algorithm !== ED25519_SIGNATURE_ALGORITHM) {
    findings.push(`${context}.signature_evidence.algorithm must be ${ED25519_SIGNATURE_ALGORITHM}`);
  }

  const publicKeyPem = typeof signature.public_key_pem === "string" ? signature.public_key_pem.trim() : "";
  let publicKey = null;
  if (!publicKeyPem || !publicKeyPem.includes("BEGIN PUBLIC KEY")) {
    findings.push(`${context}.signature_evidence.public_key_pem must be a PEM public key`);
  } else {
    try {
      publicKey = crypto.createPublicKey(publicKeyPem);
      if (publicKey.asymmetricKeyType !== "ed25519") {
        findings.push(`${context}.signature_evidence.public_key_pem must be an Ed25519 public key`);
      }
    } catch (error) {
      findings.push(`${context}.signature_evidence.public_key_pem is invalid: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  const signatureBase64 = typeof signature.signature_base64 === "string" ? signature.signature_base64.trim() : "";
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(signatureBase64) || signatureBase64.length === 0) {
    findings.push(`${context}.signature_evidence.signature_base64 must be base64`);
  }

  const payloadDigest = sha256Text(payload);
  if (signature.signed_payload_sha256 !== payloadDigest) {
    findings.push(`${context}.signature_evidence.signed_payload_sha256 must match the canonical signed receipt payload`);
  }

  if (publicKey) {
    const keyFingerprint = sha256Bytes(publicKey.export({ type: "spki", format: "der" }));
    if (signature.signer_key_fingerprint_sha256 !== keyFingerprint) {
      findings.push(`${context}.signature_evidence.signer_key_fingerprint_sha256 must match public_key_pem`);
    }
  }

  if (
    publicKey
    && publicKey.asymmetricKeyType === "ed25519"
    && signature.algorithm === ED25519_SIGNATURE_ALGORITHM
    && /^[A-Za-z0-9+/]+={0,2}$/.test(signatureBase64)
    && signatureBase64.length > 0
  ) {
    try {
      const verified = crypto.verify(
        null,
        Buffer.from(payload, "utf8"),
        publicKey,
        Buffer.from(signatureBase64, "base64"),
      );
      if (!verified) {
        findings.push(`${context}.signature_evidence signature verification failed`);
      }
    } catch (error) {
      findings.push(`${context}.signature_evidence could not be verified: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return findings;
}
