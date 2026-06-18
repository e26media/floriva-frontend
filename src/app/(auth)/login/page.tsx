"use client";

import ButtonPrimary from "@/shared/Button/ButtonPrimary";
import { Field, FieldGroup, Fieldset, Label } from "@/shared/fieldset";
import { Input } from "@/shared/input";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { finishLogin, getApiBase, normalizeUserPayload, startGoogleLogin } from "@/lib/auth";

export default function PageLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const apiBase = getApiBase();

  useEffect(() => {
    if (localStorage.getItem("floriva_token") && localStorage.getItem("floriva_user")) {
      router.replace("/");
    }
  }, [router]);

  const sendOtp = async () => {
    setError("");
    setMessage("");
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail, purpose: "login" }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || data.error || "Could not send OTP.");
      setStep("otp");
      setMessage("We sent a 6-digit code to your email.");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setError("");
    setMessage("");
    if (!/^\d{6}$/.test(otp.trim())) {
      setError("Enter the 6-digit OTP.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: otp.trim(),
          purpose: "login",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || data.error || "Invalid OTP.");

      finishLogin(data.token, normalizeUserPayload(data.user));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (step === "email") {
      void sendOtp();
      return;
    }
    void verifyOtp();
  };

  return (
    <div className="container mb-24 lg:mb-32">
      <h1 className="my-20 flex items-center justify-center text-3xl leading-[115%] font-semibold text-neutral-900 md:text-5xl md:leading-[115%] dark:text-neutral-100">
        Login
      </h1>
      <div className="mx-auto max-w-md space-y-6">
        <button
          type="button"
          onClick={startGoogleLogin}
          className="flex w-full rounded-lg bg-primary-50 px-4 py-3 text-center text-sm font-medium text-neutral-700 transition-transform hover:-translate-y-0.5 sm:px-6 dark:bg-neutral-800 dark:text-neutral-300"
        >
          <span className="grow">Continue with Google</span>
        </button>

        <div className="relative text-center">
          <span className="relative z-10 inline-block bg-white px-4 text-sm font-medium dark:bg-neutral-900 dark:text-neutral-400">
            OR
          </span>
          <div className="absolute top-1/2 left-0 w-full -translate-y-1/2 transform border border-neutral-100 dark:border-neutral-800" />
        </div>

        <form onSubmit={handleSubmit}>
          <Fieldset>
            <FieldGroup className="sm:space-y-6">
              <Field>
                <Label>Email</Label>
                <Input
                  type="email"
                  name="email"
                  placeholder="you@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading || step === "otp"}
                />
              </Field>

              {step === "otp" && (
                <Field>
                  <Label>OTP</Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    name="otp"
                    placeholder="Enter 6-digit code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    disabled={loading}
                  />
                </Field>
              )}

              {message && <p className="text-sm text-emerald-600">{message}</p>}
              {error && <p className="text-sm text-red-600">{error}</p>}

              <ButtonPrimary className="mt-2 w-full" type="submit" disabled={loading}>
                {loading ? "Please wait..." : step === "email" ? "Send OTP" : "Verify & Login"}
              </ButtonPrimary>

              {step === "otp" && (
                <button
                  type="button"
                  className="w-full text-sm text-neutral-500 underline"
                  onClick={() => {
                    setStep("email");
                    setOtp("");
                    setMessage("");
                    setError("");
                  }}
                >
                  Use a different email
                </button>
              )}
            </FieldGroup>
          </Fieldset>
        </form>

        <span className="block text-center text-sm text-neutral-700 dark:text-neutral-300">
          New user?{" "}
          <Link className="text-primary-600 underline" href="/signup">
            Create an account
          </Link>
        </span>
      </div>
    </div>
  );
}
