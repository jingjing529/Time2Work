import { NextRequest, NextResponse } from "next/server";

const TOKEN_URL = "https://oauth2.googleapis.com/token";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);

  try {
    const code = url.searchParams.get("code");
    const error = url.searchParams.get("error");

    if (error) {
      const errUrl = new URL("/", url);
      errUrl.searchParams.set("error", error);
      return NextResponse.redirect(errUrl);
    }

    if (!code) {
      const errUrl = new URL("/", url);
      errUrl.searchParams.set("error", "missing_code");
      return NextResponse.redirect(errUrl);
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      console.error("Missing env vars", {
        hasId: !!clientId,
        hasSecret: !!clientSecret,
        hasRedirect: !!redirectUri,
      });
      const errUrl = new URL("/", url);
      errUrl.searchParams.set("error", "missing_env");
      return NextResponse.redirect(errUrl);
    }

    const body = new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    });

    const tokenRes = await fetch(TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    const raw = await tokenRes.text();
    console.log("token response:", tokenRes.status, raw);

    if (!tokenRes.ok) {
      const errUrl = new URL("/", url);
      errUrl.searchParams.set("error", "token_exchange_failed");
      return NextResponse.redirect(errUrl);
    }

    const tokenData = JSON.parse(raw) as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
      scope: string;
      token_type: string;
    };

    console.log("Google OAuth tokens:", tokenData);

    const res = NextResponse.redirect(new URL("/home", url));
    res.cookies.set("google_access_token", tokenData.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: tokenData.expires_in ?? 3600, // 秒
    });

    return res;
  } catch (e) {
    console.error("Google OAuth callback error:", e);
    const errUrl = new URL("/", url);
    errUrl.searchParams.set("error", "internal");
    return NextResponse.redirect(errUrl);
  }
}
