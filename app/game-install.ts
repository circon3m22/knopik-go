/** Capture prompts before login so the welcome screen cannot miss them. */
export type InstallPrompt=Event&{prompt:()=>Promise<void>;userChoice:Promise<{outcome:"accepted"|"dismissed"}>};
type InstallState={installed:boolean;prompt:InstallPrompt|null};
const initial:InstallState={installed:false,prompt:null};
let current=initial,started=false;
const listeners=new Set<()=>void>();
export const installSnapshot=()=>current;
export const installServerSnapshot=()=>initial;
export function subscribeInstall(listener:()=>void){listeners.add(listener);return()=>{listeners.delete(listener);};}
function publish(next:InstallState){current=next;listeners.forEach(fn=>fn());}
export function startInstallSupport(){
 if(started)return;started=true;
 const display=window.matchMedia("(display-mode: standalone)");
 const installed=()=>display.matches||(navigator as Navigator&{standalone?:boolean}).standalone===true;
 publish({installed:installed(),prompt:null});
 window.addEventListener("beforeinstallprompt",event=>{
  event.preventDefault();publish({installed:installed(),prompt:event as InstallPrompt});
 });
 window.addEventListener("appinstalled",()=>publish({installed:true,prompt:null}));
 display.addEventListener("change",()=>publish({...current,installed:installed()}));
}
export async function requestGameInstall(){
 const prompt=current.prompt;if(!prompt)return "manual" as const;
 try{
  await prompt.prompt();const choice=await prompt.userChoice;
  publish({installed:current.installed,prompt:null});
  return choice.outcome;
 }catch{publish({...current,prompt:null});return "manual" as const;}
}
