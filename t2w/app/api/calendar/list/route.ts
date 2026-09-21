import {cookies} from 'next/headers';
import {NextResponse} from 'next/server';
export async function GET(){
 const token=(await cookies()).get('google_access_token')?.value;
 if(!token)return NextResponse.json({error:'Sign in with Google to connect a calendar.'},{status:401});
 try{
  const calendars:{id:string;summary:string}[]=[];let page='';
  do{
   const params=new URLSearchParams({minAccessRole:'writer',maxResults:'250',...(page?{pageToken:page}:{})});
   const r=await fetch(`https://www.googleapis.com/calendar/v3/users/me/calendarList?${params}`,{headers:{Authorization:`Bearer ${token}`},cache:'no-store'});
   if(!r.ok)return NextResponse.json({error:'Could not load writable calendars. Sign in again and allow Calendar access; check that Google Calendar API is enabled.'},{status:r.status});
   const data=await r.json();calendars.push(...(data.items||[]).map((c:{id:string;summary:string})=>({id:c.id,summary:c.summary})));page=data.nextPageToken||'';
  }while(page);
  return NextResponse.json({calendars});
 }catch{return NextResponse.json({error:'Google could not be reached.'},{status:502});}
}
