import {NextRequest,NextResponse} from 'next/server';
export async function POST(req:NextRequest){
 if(req.headers.get('origin')!==req.nextUrl.origin)return NextResponse.json({error:'Invalid request origin.'},{status:403});
 const response=NextResponse.json({ok:true},{headers:{'Cache-Control':'no-store'}});
 for(const name of ['google_access_token','google_oauth_state','google_oauth_return',...req.cookies.getAll().map(c=>c.name).filter(n=>n.startsWith('t2w-session-'))])response.cookies.set(name,'',{httpOnly:true,secure:process.env.NODE_ENV==='production',path:'/',maxAge:0});
 response.cookies.set('t2w-ignore-legacy-session','1',{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:30*86400});
 return response;
}
