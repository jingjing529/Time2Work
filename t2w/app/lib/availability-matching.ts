import type {AvailabilityDay, Member} from './workspace';
export function matchAvailability(slots: AvailabilityDay | undefined, start: number, end: number) {
  if (end <= start) throw new Error('End time must be after start time.');
  if (slots === undefined) return {status:'unknown' as const, overlap:0, coverage:0, rank:3};
  const ranges=slots.map(s=>({start:Math.max(start,s.startHour),end:Math.min(end,s.endHour)})).filter(s=>s.end>s.start).sort((a,b)=>a.start-b.start);
  let overlap=0, lastEnd=start;
  for(const r of ranges) {overlap+=Math.max(0,r.end-Math.max(lastEnd,r.start));lastEnd=Math.max(lastEnd,r.end);}
  const coverage=Math.min(1,overlap/(end-start));
  return {status:coverage===1?'full' as const:overlap>0?'partial' as const:'none' as const,overlap,coverage,rank:coverage===1?0:overlap>0?1:2};
}
export function rankMembers(members:Member[],availability:Record<string,Record<string,AvailabilityDay>>,date:string,start:number,end:number) {
 return members.map((member,index)=>({member,index,slots:availability[member.email]?.[date],...matchAvailability(availability[member.email]?.[date],start,end)})).sort((a,b)=>a.rank-b.rank||b.coverage-a.coverage||a.index-b.index);
}

export function matchWindow(members:Member[],availability:Record<string,Record<string,AvailabilityDay>>,days:string[],start:number,end:number) {
 return members.map((member,index)=>{
  const matches=days.map(day=>matchAvailability(availability[member.email]?.[day],start,end));
  const overlap=matches.reduce((n,m)=>n+m.overlap,0),total=(end-start)*days.length;
  const missing=matches.filter(m=>m.status==='unknown').length;
  const status:'full'|'partial'|'unknown'|'none'=matches.every(m=>m.status==='full')?'full':overlap>0?'partial':missing>0?'unknown':'none';
  return {member,index,overlap,coverage:overlap/total,missing,status,rank:status==='full'?0:status==='partial'?1:status==='none'?2:3};
 }).sort((a,b)=>a.rank-b.rank||b.coverage-a.coverage||a.index-b.index);
}

/** Find equally best windows; count only people free for the whole requested duration. */
export function bestAvailabilityWindows(members:Member[], availability:Record<string,Record<string,AvailabilityDay>>, durationMinutes:number) {
 if(!Number.isInteger(durationMinutes)||durationMinutes<15||durationMinutes>660||durationMinutes%15!==0)throw new Error('Duration must be 15–660 minutes in 15-minute steps.');
 const windows:{day:string;dayIndex:number;start:number;end:number;count:number}[]=[];
 const duration=durationMinutes/60;
 ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].forEach((day,dayIndex)=>{
  for(let start=8;start+duration<=19;start+=.25){
   const count=members.filter(m=>matchAvailability(availability[m.email]?.[day],start,start+duration).status==='full').length;
   windows.push({day,dayIndex,start,end:start+duration,count});
  }
 });
 const maximum=Math.max(0,...windows.map(w=>w.count));
 return {maximum,windows:maximum?windows.filter(w=>w.count===maximum):[]};
}

/** Peak attendance, merging adjacent 15-minute cells only when the same people stay free. */
export function peakAvailabilityWindows(members:Member[],availability:Record<string,Record<string,AvailabilityDay>>) {
 const cells:{day:string;dayIndex:number;start:number;end:number;count:number;roster:string}[]=[];
 ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].forEach((day,dayIndex)=>{
  for(let start=8;start<19;start+=.25){
   const free=members.filter(m=>matchAvailability(availability[m.email]?.[day],start,start+.25).status==='full');
   cells.push({day,dayIndex,start,end:start+.25,count:free.length,roster:JSON.stringify(free.map(m=>m.id).sort())});
  }
 });
 const maximum=Math.max(0,...cells.map(c=>c.count));
 const windows:typeof cells=[];
 if(maximum)for(const cell of cells.filter(c=>c.count===maximum)){
  const last=windows.at(-1);
  if(last&&last.day===cell.day&&last.end===cell.start&&last.roster===cell.roster)last.end=cell.end;
  else windows.push({...cell});
 }
 return {maximum,windows};
}

/** Ranked alternatives across the chosen weekdays, including lower-attendance windows. */
export function rankedMeetingWindows(members:Member[],availability:Record<string,Record<string,AvailabilityDay>>,durationMinutes:number,days:string[],dayOrder:string[]=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],startHour=8,endHour=19,requiredIds:string[]=[]) {
 if(durationMinutes!==0&&(!Number.isInteger(durationMinutes)||durationMinutes<15||durationMinutes>660||durationMinutes%15!==0))throw new Error('Invalid duration.');
 const candidates:{day:string;dayIndex:number;start:number;end:number;count:number;attendees:Member[];roster:string}[]=[];
 dayOrder.forEach((day,dayIndex)=>{
  if(!days.includes(day))return;
  const duration=durationMinutes===0?.25:durationMinutes/60;
  for(let start=startHour;start+duration<=endHour;start+=.25){
   const attendees=members.filter(m=>matchAvailability(availability[m.email]?.[day],start,start+duration).status==='full');
   if(requiredIds.some(id=>!attendees.some(m=>m.id===id)))continue;
   if(!attendees.length)continue;
   const roster=JSON.stringify(attendees.map(m=>m.id).sort());
   const last=candidates.at(-1);
   if(durationMinutes===0&&last&&last.day===day&&last.end===start&&last.roster===roster)last.end=start+duration;
   else candidates.push({day,dayIndex,start,end:start+duration,count:attendees.length,attendees,roster});
  }
 });
 candidates.sort((a,b)=>b.count-a.count||a.dayIndex-b.dayIndex||a.start-b.start);
 return {maximum:candidates[0]?.count||0,windows:candidates};
}

/** All peak-attendance options, consolidated when the same people cover the entire union. */
export function mergedBestMeetingWindows(members:Member[],availability:Record<string,Record<string,AvailabilityDay>>,durationMinutes:number,days:string[],dayOrder:string[]=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],startHour=8,endHour=19,requiredIds:string[]=[]) {
 const ranked=rankedMeetingWindows(members,availability,durationMinutes,days,dayOrder,startHour,endHour,requiredIds);
 const windows:typeof ranked.windows=[];
 for(const candidate of ranked.windows.filter(w=>w.count===ranked.maximum)) {
  const previous=windows.findLast(w=>w.day===candidate.day&&w.roster===candidate.roster&&w.end>=candidate.start);
  if(previous)previous.end=Math.max(previous.end,candidate.end);
  else windows.push({...candidate});
 }
 windows.sort((a,b)=>a.dayIndex-b.dayIndex||a.start-b.start);
 return {maximum:ranked.maximum,windows};
}
