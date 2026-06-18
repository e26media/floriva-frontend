export type GoogleAuthPayload = {
  token: string;
  name: string;
  email: string;
  countrySlug?: string;
};

export async function completeGoogleLogin(payload: GoogleAuthPayload) {
  const { finishLogin } = await import('@/lib/auth');
  finishLogin(payload.token, {
    username: payload.name,
    email: payload.email,
    countrySlug: payload.countrySlug || undefined,
  });
}
