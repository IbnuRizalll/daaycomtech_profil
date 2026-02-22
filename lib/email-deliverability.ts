import { resolve4, resolve6, resolveMx } from 'node:dns/promises';

type EmailProvider = 'google' | 'microsoft' | 'other' | 'unknown';
type EmailProviderPolicy = 'allow' | 'google_microsoft_only';

type ValidateEmailOptions = {
  providerPolicy?: string | null;
  providerRestrictionMessage?: string;
};

type EmailValidationResult = {
  ok: boolean;
  normalizedEmail: string;
  provider: EmailProvider;
  reason?: string;
};

const GOOGLE_DOMAINS = new Set(['gmail.com', 'googlemail.com']);
const MICROSOFT_DOMAINS = new Set([
  'outlook.com',
  'hotmail.com',
  'live.com',
  'msn.com',
]);

const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com',
  'guerrillamail.com',
  '10minutemail.com',
  'temp-mail.org',
  'tempmail.com',
  'trashmail.com',
  'yopmail.com',
  'sharklasers.com',
  'dispostable.com',
  'maildrop.cc',
  'throwawaymail.com',
]);

const TEMPORARY_DNS_ERROR_CODES = new Set([
  'EAI_AGAIN',
  'ETIMEOUT',
  'SERVFAIL',
  'REFUSED',
]);

const GOOGLE_MX_PATTERNS = [/\.google\.com$/i, /\.googlemail\.com$/i];
const MICROSOFT_MX_PATTERNS = [/\.outlook\.com$/i, /\.protection\.outlook\.com$/i];

const normalizePolicy = (value?: string | null): EmailProviderPolicy => {
  const normalized = String(value || 'allow').trim().toLowerCase();
  return normalized === 'google_microsoft_only' || normalized === 'strict'
    ? 'google_microsoft_only'
    : 'allow';
};

const withTimeout = async <T>(promise: Promise<T>, timeoutMs = 2500): Promise<T> => {
  return await Promise.race([
    promise,
    new Promise<T>((_resolve, reject) => {
      setTimeout(() => reject(new Error('DNS_TIMEOUT')), timeoutMs);
    }),
  ]);
};

const toErrorCode = (error: unknown) => {
  const code = (error as { code?: string } | null)?.code;
  return typeof code === 'string' ? code.toUpperCase() : '';
};

const normalizeHostname = (value: string) => value.trim().toLowerCase().replace(/\.$/, '');

const isGoogleOrMicrosoft = (provider: EmailProvider) =>
  provider === 'google' || provider === 'microsoft';

const classifyProviderFromDomain = (domain: string): EmailProvider => {
  if (GOOGLE_DOMAINS.has(domain)) return 'google';
  if (MICROSOFT_DOMAINS.has(domain)) return 'microsoft';
  return 'unknown';
};

const classifyProviderFromMxHosts = (mxHosts: string[]): EmailProvider => {
  if (mxHosts.some((host) => GOOGLE_MX_PATTERNS.some((pattern) => pattern.test(host)))) {
    return 'google';
  }
  if (mxHosts.some((host) => MICROSOFT_MX_PATTERNS.some((pattern) => pattern.test(host)))) {
    return 'microsoft';
  }
  return mxHosts.length > 0 ? 'other' : 'unknown';
};

const getPolicyMessage = (options?: ValidateEmailOptions) =>
  options?.providerRestrictionMessage ||
  'Gunakan email yang aktif di Google (Gmail/Workspace) atau Microsoft (Outlook/365).';

const resolveMxHosts = async (domain: string) => {
  try {
    const mx = await withTimeout(resolveMx(domain));
    const hosts = mx
      .map((record) => normalizeHostname(String(record.exchange || '')))
      .filter(Boolean);
    return { hosts, temporaryError: false };
  } catch (error) {
    const code = toErrorCode(error);
    if (code === 'ENOTFOUND' || code === 'ENODATA') {
      return { hosts: [] as string[], temporaryError: false };
    }
    if (TEMPORARY_DNS_ERROR_CODES.has(code) || (error as Error).message === 'DNS_TIMEOUT') {
      return { hosts: [] as string[], temporaryError: true };
    }
    return { hosts: [] as string[], temporaryError: true };
  }
};

const hasAddressRecord = async (domain: string) => {
  const [ipv4, ipv6] = await Promise.allSettled([
    withTimeout(resolve4(domain)),
    withTimeout(resolve6(domain)),
  ]);

  const hasIpv4 = ipv4.status === 'fulfilled' && ipv4.value.length > 0;
  const hasIpv6 = ipv6.status === 'fulfilled' && ipv6.value.length > 0;

  const hasTemporaryIssue =
    [ipv4, ipv6].some((result) => {
      if (result.status !== 'rejected') return false;
      const code = toErrorCode(result.reason);
      return (
        TEMPORARY_DNS_ERROR_CODES.has(code) ||
        (result.reason as Error)?.message === 'DNS_TIMEOUT'
      );
    }) && !hasIpv4 && !hasIpv6;

  return { hasRecord: hasIpv4 || hasIpv6, temporaryError: hasTemporaryIssue };
};

export async function validateEmailDeliverability(
  emailInput: string,
  options?: ValidateEmailOptions,
): Promise<EmailValidationResult> {
  const normalizedEmail = String(emailInput || '').trim().toLowerCase();
  const [localPart = '', rawDomain = ''] = normalizedEmail.split('@');
  const domain = normalizeHostname(rawDomain);
  const providerPolicy = normalizePolicy(options?.providerPolicy);
  const requireGoogleMicrosoftOnly = providerPolicy === 'google_microsoft_only';

  if (!localPart || !domain) {
    return {
      ok: false,
      normalizedEmail,
      provider: 'unknown',
      reason: 'Format email tidak valid.',
    };
  }

  if (DISPOSABLE_DOMAINS.has(domain)) {
    return {
      ok: false,
      normalizedEmail,
      provider: 'other',
      reason: 'Gunakan email yang aktif (bukan email sementara/disposable).',
    };
  }

  let provider = classifyProviderFromDomain(domain);
  const mxResult = await resolveMxHosts(domain);

  if (mxResult.hosts.length > 0) {
    if (provider === 'unknown') {
      provider = classifyProviderFromMxHosts(mxResult.hosts);
    }
  } else {
    const addressResult = await hasAddressRecord(domain);
    if (!addressResult.hasRecord && !mxResult.temporaryError && !addressResult.temporaryError) {
      return {
        ok: false,
        normalizedEmail,
        provider,
        reason: 'Domain email tidak aktif atau tidak menerima email.',
      };
    }
  }

  if (requireGoogleMicrosoftOnly && !isGoogleOrMicrosoft(provider)) {
    return {
      ok: false,
      normalizedEmail,
      provider,
      reason: getPolicyMessage(options),
    };
  }

  return {
    ok: true,
    normalizedEmail,
    provider: provider === 'unknown' ? 'other' : provider,
  };
}

export async function validateContactEmail(emailInput: string): Promise<EmailValidationResult> {
  return validateEmailDeliverability(emailInput, {
    providerPolicy: process.env.CONTACT_EMAIL_PROVIDER_POLICY,
  });
}

export async function validateAdminEmail(emailInput: string): Promise<EmailValidationResult> {
  return validateEmailDeliverability(emailInput, {
    providerPolicy:
      process.env.ADMIN_EMAIL_PROVIDER_POLICY ||
      process.env.CONTACT_EMAIL_PROVIDER_POLICY ||
      'google_microsoft_only',
    providerRestrictionMessage:
      'Gunakan email admin yang aktif di Google (Gmail/Workspace) atau Microsoft (Outlook/365).',
  });
}
