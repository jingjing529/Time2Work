import { NextRequest, NextResponse } from "next/server";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";

export async function GET(req:NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID!;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI!;

  const state = crypto.randomUUID();

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile https://www.googleapis.com/auth/calendar",
    access_type: "offline",
    include_granted_scopes: "true",
    state,
  });

  const redirectUrl = `${GOOGLE_AUTH_URL}?${params.toString()}`;

  const res = NextResponse.redirect(redirectUrl);
  res.cookies.set("google_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });

  const returnTo=req.nextUrl.searchParams.get("returnTo");
  if(returnTo&&(returnTo.startsWith('/join#token=')||/^\/\?action=(join|create)$/.test(returnTo)||/^\/organizations\/[a-f0-9-]{36}\?google=1$/.test(returnTo))&&returnTo.length<2000)res.cookies.set('google_oauth_return',returnTo,{httpOnly:true,secure:process.env.NODE_ENV==='production',path:'/',maxAge:600});
  else res.cookies.delete('google_oauth_return');
  return res;
}
