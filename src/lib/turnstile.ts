interface TurnstileSiteVerifyResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  "error-codes"?: string[];
  action?: string;
  cdata?: string;
}

const TURNSTILE_ENABLED =
  process.env.ENABLE_TURNSTILE === "true" || process.env.NEXT_PUBLIC_ENABLE_TURNSTILE === "true";

export interface TurnstileVerificationResult {
  success: boolean;
  errorCodes?: string[];
  skipped?: boolean;
}

/**
 * 验证 Cloudflare Turnstile Token
 */
export async function verifyTurnstileToken(
  token?: string | null,
  remoteIp?: string | null
): Promise<TurnstileVerificationResult> {
  if (!TURNSTILE_ENABLED) {
    return {
      success: true,
      skipped: true,
    };
  }

  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  if (!secretKey) {
    console.warn("⚠️ [Security] 未配置 TURNSTILE_SECRET_KEY，跳过验证码验证");
    return {
      success: true,
      skipped: true,
    };
  }

  if (!token) {
    return {
      success: false,
      errorCodes: ["missing-token"],
    };
  }

  const formData = new URLSearchParams();
  formData.append("secret", secretKey);
  formData.append("response", token);

  if (remoteIp) {
    formData.append("remoteip", remoteIp);
  }

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData,
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("❌ [Security] Turnstile 验证请求失败", response.status, response.statusText);
      return {
        success: false,
        errorCodes: ["verification-request-failed"],
      };
    }

    const result = (await response.json()) as TurnstileSiteVerifyResponse;

    if (!result.success) {
      console.warn("🚫 [Security] Turnstile 验证未通过", result["error-codes"]);
    }

    return {
      success: !!result.success,
      errorCodes: result["error-codes"],
    };
  } catch (error) {
    console.error("❌ [Security] Turnstile 验证出现异常", error);
    return {
      success: false,
      errorCodes: ["verification-error"],
    };
  }
}
