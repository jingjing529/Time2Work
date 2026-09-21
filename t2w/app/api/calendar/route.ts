import {validateEvent} from "../../lib/events";
import {cookies} from "next/headers";
import {NextRequest, NextResponse} from "next/server";
export async function GET(req:NextRequest) {
  const token=(await cookies()).get("google_access_token")?.value;
  if(!token) return NextResponse.json({error:"Sign in with Google to read this calendar."},{status:401});
  const id=req.nextUrl.searchParams.get("id")?.trim();
  if(!id || id.length>500) return NextResponse.json({error:"Enter a valid calendar ID."},{status:400});
  const query=new URLSearchParams({singleEvents:"true",orderBy:"startTime",timeMin:new Date().toISOString(),maxResults:"100"});
  try {
    const response=await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(id)}/events?${query}`,{headers:{Authorization:`Bearer ${token}`},cache:"no-store"});
    if(!response.ok) return NextResponse.json({error:response.status===401?"Your Google session expired. Sign in again.":"Calendar unavailable. Check its ID, sharing permissions, and that Google Calendar API is enabled in your Cloud project."},{status:response.status});
    const data=await response.json();
    return NextResponse.json({events:(data.items||[]).map((e:{id:string;summary?:string;start?:{dateTime?:string;date?:string};htmlLink?:string})=>({id:e.id,title:e.summary||"Busy",due:e.start?.dateTime||e.start?.date,link:e.htmlLink})),more:!!data.nextPageToken});
  } catch {return NextResponse.json({error:"Google Calendar could not be reached. Try again."},{status:502});}
}

export async function POST(req:NextRequest) {
 if(req.headers.get('origin')!==req.nextUrl.origin)return NextResponse.json({error:'Invalid request origin.'},{status:403});
 const token=(await cookies()).get('google_access_token')?.value;
 if(!token)return NextResponse.json({error:'Sign in with Google again to write to the organization calendar.'},{status:401});
 try{
  const event={...await req.json(),sendInvites:true};validateEvent(event);
  if(typeof event.calendarId!=='string'||!event.calendarId.trim()||event.calendarId.length>500)throw new Error('Choose an organization calendar.');
  const url=`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(event.calendarId)}/events`;
  const body={id:event.id,summary:event.title.trim(),description:`${event.description}\n\nParticipants: ${event.participantEmails.join(", ")}`,start:{dateTime:event.start,timeZone:event.timeZone},end:{dateTime:event.end,timeZone:event.timeZone},...(event.sendInvites?{attendees:event.participantEmails.map((email:string)=>({email}))}:{}),extendedProperties:{private:{time2workId:event.id}}};
  let response=await fetch(`${url}?sendUpdates=all`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(body)});
  // Stable event IDs make retries after an interrupted response safe.
  if(response.status===409)response=await fetch(`${url}/${event.id}`,{headers:{Authorization:`Bearer ${token}`},cache:'no-store'});
  if(!response.ok)return NextResponse.json({error:response.status===401?'Google session expired. Sign in again, then retry.':'Google could not save the event. Check Calendar API access and “Make changes to events” permission.'},{status:response.status});
  const saved=await response.json();return NextResponse.json({id:saved.id,link:saved.htmlLink});
 }catch(e){return NextResponse.json({error:e instanceof SyntaxError?'Invalid event data.':e instanceof Error?e.message:'Unable to save Google event.'},{status:400});}
}
