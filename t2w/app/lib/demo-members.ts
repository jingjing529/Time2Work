import type {Workspace} from './workspace';
const days=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const profiles=[
 {name:'Alex Chen',hours:[[[9,12],[13,17]],[[9,12],[13,17]],[[9,12],[13,17]],[[9,12],[13,17]],[[9,12],[13,15]]]},
 {name:'Maya Patel',hours:[[[8,12]],[[8,12]],[[8,11]],[[8,12]],[[8,11.5]]]},
 {name:'Jordan Lee',hours:[[[13,18]],[[12,18]],[[13,18]],[[12,17]],[[13,19]]]},
 {name:'Sofia Garcia',hours:[[[10,12],[14,16]],[[9,11],[14,17]],[[10,12],[14,16]],[[9,12],[15,17]],[[10,13]]]},
 {name:'Noah Kim',hours:[[[9,17]],[[9,17]],[],[[9,17]],[[9,14]]]},
 {name:'Emma Wilson',hours:[[[10,15]],[[10,14]],[[9,15]],[[10,15]],[]]},
 {name:'Liam Brown',hours:[[[8,10],[16,19]],[[8,10],[16,19]],[[8,11],[15,18]],[[8,10],[16,19]],[[8,10],[15,18]]]},
 {name:'Olivia Zhao',hours:[[[9.5,11.5],[13.5,16]],[[10,12],[13,16]],[[9,11.5],[13,16.5]],[[9.5,12],[14,16]],[[9,12]]]},
 {name:'Ethan Davis',hours:[[[11,14]],[[11,15]],[[10,14]],[[11,14]],[[10,13]]]},
 {name:'Ava Martinez',hours:[[[9,12],[13,16]],[],[[9,12],[13,16]],[],[[9,12],[13,16]]]}
];
/** One-time fixture for the specific organization requested by the user. */
export function seedRequestedDemo(code:string,data:Workspace):Workspace {
 if(code!=='T2W-4BE413B4')return data;
 if(data.demoSeedVersion===1&&profiles.every((_,i)=>data.members.some(m=>m.email===`demo.${i+1}@time2work.invalid`)&&['Sat','Sun'].every(day=>data.weeklyAvailability?.[`demo.${i+1}@time2work.invalid`]?.[day]!==undefined)))return data;
 const members=[...data.members];const weeklyAvailability={...data.weeklyAvailability};
 profiles.forEach((profile,index)=>{
  const id=`demo-availability-${index+1}`;
  const email=`demo.${index+1}@time2work.invalid`;
  if(!members.some(m=>m.id===id||m.email===email))members.push({id,name:profile.name,email,role:'member'});
  const hours=[...profile.hours,index%3===0?[]:[[10+index%3,14+index%3]],index%2===0?[[12,16]]:[]];
  const defaults=Object.fromEntries(days.map((day,i)=>[day,hours[i].map(([startHour,endHour])=>({startHour,endHour}))]));
  weeklyAvailability[email]=weeklyAvailability[email]?{Sat:defaults.Sat,Sun:defaults.Sun,...weeklyAvailability[email]}:defaults;
 });
 return {...data,members,weeklyAvailability,demoSeedVersion:1};
}

/** Explicitly add missing fixtures to the current preview without replacing edits. */
export function restoreDemoMembers(data:Workspace):Workspace { return seedRequestedDemo('T2W-4BE413B4',data); }
