import "server-only";
import { ApiError } from "@/server/http";
import { logError } from "@/server/log";
import type { OtpSender } from "./types";

const DEFAULT_FROM = "ABHA Health Portal <onboarding@resend.dev>";

export const resendSender: OtpSender = {
  isConfigured() {
    return Boolean(process.env.RESEND_API_KEY);
  },

  async send(email: string, otp: string) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + process.env.RESEND_API_KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.OTP_EMAIL_FROM || DEFAULT_FROM,
        to: [email],
        subject: "Your ABHA Health Portal login code",
        text:
          "Your one-time password is " +
          otp +
          ".\n\nIt works for 5 minutes and only once. Never share it with anyone, including hospital staff.\n\n" +
          "If you did not try to log in, you can ignore this email.",
      }),
    });

    if (!response.ok) {
      logError(new Error("Resend returned " + response.status), "otp-email");
      throw new ApiError("INTERNAL", "We could not send the OTP email. Please try again.");
    }
  },
};
