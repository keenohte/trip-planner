export type Vote = 'love' | 'interested' | 'pass' | null;
export type Idea = {
  id: string; title: string; country: 'Korea'|'Japan'; city: string; neighborhood?: string;
  types: string[]; addedBy: 'You'|'Partner'; yourVote: Vote; partnerVote: Vote; date?: string;
};
export const ideas: Idea[] = [
  {id:'pontocho',title:'Pontocho Alley',country:'Japan',city:'Kyoto',neighborhood:'Pontocho',types:['Sight','Nightlife'],addedBy:'Partner',yourVote:'interested',partnerVote:'interested'},
  {id:'fushimi',title:'Fushimi Inari Taisha',country:'Japan',city:'Kyoto',neighborhood:'Fushimi',types:['Sight','Outdoors'],addedBy:'Partner',yourVote:null,partnerVote:'love'},
  {id:'watchmake',title:'Watchmake Factory',country:'Korea',city:'Seoul',neighborhood:'Mapo-gu',types:['Shopping','Experience'],addedBy:'You',yourVote:'love',partnerVote:null},
  {id:'nautilus',title:'Ueno Aquarium Restaurant Nautilus',country:'Japan',city:'Tokyo',neighborhood:'Ueno',types:['Restaurant','Experience'],addedBy:'You',yourVote:'interested',partnerVote:null},
  {id:'makgeolli',title:"Mr. Ahn’s Craft Makgeolli",country:'Korea',city:'Seoul',neighborhood:'Yongsan',types:['Restaurant','Nightlife'],addedBy:'You',yourVote:'love',partnerVote:'interested'},
  {id:'gion',title:'Gion evening wander',country:'Japan',city:'Kyoto',neighborhood:'Gion',types:['Sight','Nightlife'],addedBy:'Partner',yourVote:null,partnerVote:'love'}
];
export const positive = (v: Vote) => v === 'love' || v === 'interested';
export const confirmedIdeas = ideas.filter(i => positive(i.yourVote) && positive(i.partnerVote));
