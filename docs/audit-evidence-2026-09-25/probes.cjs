const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(process.argv[2] || path.join(__dirname, '../..'));
const ts = require(path.join(root,'node_modules/typescript'));
function compile(src, name) {
 return ts.transpileModule(src, {fileName:name, compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
}
function run(src,name,bindings={}) {
 const module={exports:{}};
 vm.runInNewContext(compile(src,name),{module,exports:module.exports,...bindings},{filename:name});
 return module.exports;
}
function load(rel) {
 const full=path.join(root,rel);
 return run(fs.readFileSync(full,'utf8'),rel,{require(spec){
  let target=spec.startsWith('@/')?`src/${spec.slice(2)}`:path.join(path.dirname(rel),spec);
  if(!path.extname(target)) target += '.ts';
  return load(target);
 }});
}
function extract(rel,names) {
 const src=fs.readFileSync(path.join(root,rel),'utf8');
 const file=ts.createSourceFile(rel,src,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 const nodes=[];
 function visit(node) {
  if(ts.isFunctionDeclaration(node)&&node.name&&names.includes(node.name.text)) nodes.push(node.getText(file));
  if(ts.isVariableStatement(node)&&node.declarationList.declarations.some(d=>names.includes(d.name.getText(file)))) nodes.push(node.getText(file));
  ts.forEachChild(node,visit);
 }
 visit(file);
 return nodes.join('\n')+'\nexport { '+names.join(',')+' };';
}
const {records,medications}=load('src/data/records.ts');
const {family,pulseFor}=load('src/data/family.ts');
const {careProfessionals}=load('src/data/care.ts');
const {todayItems,homeFamilyPulse,goals}=load('src/data/home.ts');
const {notifications}=load('src/data/notifications.ts');
const {responseFor,loggingResponseFor}=load('src/utils/aiResponse.ts');
const {seedBookings}=run(extract('src/state/AppState.tsx',['seedBookings']),'seedBookings.ts');
const {nextCareFor,whenLabel}=run(extract('app/(tabs)/index.tsx',['nextCareFor','whenLabel']),'homeFunctions.ts');
const {dayFromLabel}=run(extract('app/calendar.tsx',['dayFromLabel']),'calendarFunctions.ts');
const {savitaResponse}=run(extract('src/accounts/savita/SavitaAI.tsx',['savitaResponse']),'savitaResponse.ts');
const {groupFor}=run(extract('app/records.tsx',['groupFor']),'recordGroups.ts');
const result={
 inventory:{family:family.length,records:records.length,medicationEntries:medications.length,providers:careProfessionals.length,tasks:todayItems.length,goals:goals.length,bookings:seedBookings.length,notifications:notifications.length},
 probes:[]
};
const add=(name,evidence)=>result.probes.push({name,evidence});
for(const input of ['Dad did not take his medication','Dad took his telmisartan medication','Mum felt dizzy after taking her medication','Grandma completed no exercises']) {
 const {log}=loggingResponseFor(input);
 add('Natural-language classification',{input,category:log.category,memberId:log.memberId});
}
const handled=[];
const negativeLog=loggingResponseFor('Dad did not take his medication').log;
const actionSource=extract('app/(tabs)/ai.tsx',['handleAction']);
const {handleAction}=run(actionSource,'actualLogAction.ts',{
 pendingLog:negativeLog,addFamilyLog:x=>handled.push({familyLog:x}),nextId:x=>x+'-probe',tasks:todayItems,
 toggleTask:x=>handled.push({toggleTask:x}),takenMedicationIds:[],toggleMedication:x=>handled.push({toggleMedication:x}),
 setMessages:()=>{},setPendingLog:()=>{},scrollToLatest:()=>{},addTask:()=>{},send:()=>{},router:{push:()=>{}}
});
handleAction('confirm-family-log');
add('Actual confirmation handler with negated medication input',handled);
const future={...seedBookings[0],id:'far-future',date:'31 December 2026'};
add('Up Next ordering',{input:[future.id,...seedBookings.filter(b=>b.status==='Confirmed').map(b=>b.id)],selected:nextCareFor([future,...seedBookings],'all').id});
add('Conflicting relative dates',{homeJuly14:whenLabel(seedBookings[0]),calendarTomorrow:dayFromLabel('Tomorrow'),calendarJuly14:dayFromLabel('14 July 2026')});
add('Latest vaccination report explanation',savitaResponse('Explain my latest report',records,'savita-flu-2025'));
add('Foreign record supplied to Savita assistant',savitaResponse('Explain this report',records,'rajiv-diabetes-jul'));
add('Language search placeholder versus actual predicate',{query:'Hindi',matches:careProfessionals.filter(p=>`${p.name} ${p.title} ${p.specialisations.join(' ')}`.toLowerCase().includes('hindi')).length,hindiSpeaking:careProfessionals.filter(p=>p.languages.includes('Hindi')).length});
add('Mixed-currency price sort',careProfessionals.slice().sort((a,b)=>a.price-b.price).slice(0,4).map(p=>({name:p.name,currency:p.currency,price:p.price})));
add('Record date grouping',{date:'25 September 2026',group:groupFor('25 September 2026')});
add('Unknown metric member fallback',{requested:'missing-member',resolved:pulseFor('missing-member').memberId,memberExists:family.some(m=>m.id==='missing-member')});
add('Static Today response after simulated completion',{tasksCompleted:todayItems.map(t=>({...t,completed:true})).every(t=>t.completed),response:responseFor('Summarise today for my family').text,homeSummary:homeFamilyPulse.summary});
const {palette}=load('src/theme/colors.ts');
function lum(hex){const vals=hex.slice(1).match(/../g).map(x=>parseInt(x,16)/255).map(c=>c<=0.04045?c/12.92:((c+0.055)/1.055)**2.4);return vals[0]*.2126+vals[1]*.7152+vals[2]*.0722;}
function contrast(a,b){const x=lum(a),y=lum(b);return Number(((Math.max(x,y)+.05)/(Math.min(x,y)+.05)).toFixed(2));}
result.contrastSamples={secondaryOnBackground:contrast(palette.textSecondary,palette.background),tertiaryOnSurface:contrast(palette.textTertiary,palette.surface),whiteOnBlue:contrast(palette.white,palette.blue)};
fs.writeFileSync('/tmp/circle-audit-probes.json',JSON.stringify(result,null,2));
console.log(JSON.stringify(result,null,2));
