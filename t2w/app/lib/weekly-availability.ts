import type {Workspace,AvailabilityDay} from './workspace';
export const WEEKDAYS=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
// Preserve the latest saved weekday from the previous date-based preview.
export function weeklyAvailability(data:Workspace) {
 const result:Record<string,Record<string,AvailabilityDay>>={};
 for(const [email,days] of Object.entries(data.availability||{})) {
  result[email]={};
  for(const date of Object.keys(days).sort()) {
   if(!/^\d{4}-\d{2}-\d{2}$/.test(date))continue;
   const index=(new Date(`${date}T12:00:00`).getDay()+6)%7;
   if(index>=0&&index<7)result[email][WEEKDAYS[index]]=days[date];
  }
 }
 for(const [email,days] of Object.entries(data.weeklyAvailability||{}))result[email]={...result[email],...days};
 return result;
}
export function dragRange(anchor:number,current:number):[number,number] {
 const quantize=(n:number)=>Math.max(8,Math.min(19,Math.round(n*4)/4));
 const a=quantize(anchor),b=quantize(current);
 if(a===b)return a===19?[18.75,19]:[a,a+.25];
 return [Math.min(a,b),Math.max(a,b)];
}
