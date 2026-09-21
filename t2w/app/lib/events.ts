export type ScheduledEvent={id:string;title:string;start:string;end:string;timeZone:string;description:string;participantIds:string[];participantNames?:string[];participantEmails:string[];calendarId?:string;sendInvites:boolean;googleStatus:'local'|'pending'|'synced'|'failed';googleLink?:string;syncError?:string};
export type MeetingSelection={days:string[];start:number;end:number;duration:number;requiredIds?:string[];memberIds:string[]};
export function validateEvent(event:ScheduledEvent){
 if(!event||typeof event.title!=='string'||!event.title.trim()||event.title.length>150)throw new Error('Enter an event title (up to 150 characters).');
 if(!/^[a-f0-9]{32}$/.test(event.id))throw new Error('Invalid event ID.');
 if(!Number.isFinite(Date.parse(event.start))||!Number.isFinite(Date.parse(event.end))||Date.parse(event.end)<=Date.parse(event.start))throw new Error('Choose a valid start and end time.');
 if(!Array.isArray(event.participantIds)||!event.participantIds.length||event.participantIds.length>200)throw new Error('Select 1–200 participants.');
 if(typeof event.description!=='string'||event.description.length>5000)throw new Error('Description is too long.');
 if(typeof event.timeZone!=='string'||!event.timeZone)throw new Error('Invalid timezone.');
 if(typeof event.sendInvites!=='boolean'||!Array.isArray(event.participantEmails)||event.participantEmails.length>200||event.participantEmails.some(email=>typeof email!=='string'||email.length>254))throw new Error('Invalid participants.');
 if(event.sendInvites&&(!event.participantEmails.length||event.participantEmails.some(email=>typeof email!=='string'||! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.endsWith('.invalid'))))throw new Error('Google invitations need real email addresses. Remove demo members or use real member email addresses.');
 try{new Intl.DateTimeFormat('en',{timeZone:event.timeZone});}catch{throw new Error('Invalid timezone.');}
}
