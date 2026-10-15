import test from 'node:test';import assert from 'node:assert/strict';
import {startInstallSupport,requestGameInstall,installSnapshot,subscribeInstall} from '../app/game-install.ts';
test('install prompts survive the login screen, dismissal is retryable and only appinstalled confirms installation',async()=>{
 const oldWindow=globalThis.window,nav=Object.getOwnPropertyDescriptor(globalThis,'navigator');
 const display=new EventTarget();display.matches=false;const win=new EventTarget();win.matchMedia=()=>display;
 globalThis.window=win;Object.defineProperty(globalThis,'navigator',{configurable:true,value:{standalone:false}});
 let changes=0;const unsubscribe=subscribeInstall(()=>changes++);
 try{
  startInstallSupport();assert.equal(await requestGameInstall(),'manual');
  for(const outcome of ['dismissed','accepted']){
   let prompted=0;const event=new Event('beforeinstallprompt',{cancelable:true});Object.assign(event,{prompt:async()=>{prompted++;},userChoice:Promise.resolve({outcome})});
   win.dispatchEvent(event);assert.equal(event.defaultPrevented,true);assert.equal(installSnapshot().prompt,event);
   assert.equal(await requestGameInstall(),outcome);assert.equal(prompted,1);assert.equal(installSnapshot().prompt,null);assert.equal(installSnapshot().installed,false);
  }
  win.dispatchEvent(new Event('appinstalled'));assert.equal(installSnapshot().installed,true);assert.ok(changes>=5);
 }finally{unsubscribe();globalThis.window=oldWindow;if(nav)Object.defineProperty(globalThis,'navigator',nav);else delete globalThis.navigator;}
});
