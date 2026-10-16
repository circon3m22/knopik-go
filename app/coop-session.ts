import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";
import { COOP_PROTOCOL, COOP_STALE_MS, readCoopRoom, normalizeCoopCode, type CoopRoom, type CoopSlot } from "./coop-protocol.ts";

export type CoopPacket = {v:number;type:string;round:number;[key:string]:unknown};
export type CoopConnection = {room:CoopRoom|null;connected:boolean;peerOnline:boolean;peerVisible:boolean;error:string;busy:boolean;latency:number};
type Action="create"|"join"|"heartbeat"|"ready"|"start"|"lobby"|"leave";
const empty:CoopConnection={room:null,connected:false,peerOnline:false,peerVisible:true,error:"",busy:false,latency:0};
export const coopSessionKey=(userId:string)=>`knopik-go:coop-session:${userId}`;
export const coopWorldKey=(room:CoopRoom)=>`knopik-go:coop-world:${room.id}:${room.round}`;

/** All subscriptions, deadlines and cleanup belong to one mounted room, never the save loop. */
export class CoopSession {
  private state:CoopConnection={...empty};
  private listeners=new Set<()=>void>();
  private packetListeners=new Set<(packet:CoopPacket)=>void>();
  private channels:RealtimeChannel[]=[];
  private joined=[false,false];
  private stopped=false;
  private connectingId="";
  private channelVersion=0;
  private timer:ReturnType<typeof setInterval>|null=null;
  private refreshAt=0;
  private peerAt=-Infinity;
  private pingAt=0;
  private pendingPing=0;
  private requestQueue:Promise<unknown>=Promise.resolve();
  private token:string;
  private visibility=()=>{this.sendHello();};
  private client:SupabaseClient;
  readonly userId:string;
  constructor(client:SupabaseClient,userId:string){
    this.client=client;this.userId=userId;
    let saved:{token?:string}|null=null;try{saved=JSON.parse(sessionStorage.getItem(coopSessionKey(userId))??"null");}catch{}
    this.token=typeof saved?.token==="string"&&/^[0-9a-f-]{36}$/.test(saved.token)?saved.token:crypto.randomUUID();
  }
  get slot():CoopSlot{return this.state.room?.host_id===this.userId?0:1;}
  snapshot=()=>this.state;
  subscribe=(listener:()=>void)=>{this.listeners.add(listener);return()=>{this.listeners.delete(listener);};};
  onPacket(listener:(packet:CoopPacket)=>void){this.packetListeners.add(listener);return()=>{this.packetListeners.delete(listener);};}
  private update(patch:Partial<CoopConnection>){if(this.stopped)return;this.state={...this.state,...patch};for(const listener of this.listeners)listener();}
  private remember(room:CoopRoom){try{sessionStorage.setItem(coopSessionKey(this.userId),JSON.stringify({token:this.token,code:room.code}));}catch{}}
  private command(action:Action,code=this.state.room?.code??""):Promise<CoopRoom>{
    const run=async()=>{
      if(this.stopped)throw new Error("Комната закрыта.");
      const {data,error}=await this.client.rpc("knopik_go_coop_command",{p_action:action,p_code:code,p_token:this.token});
      if(error){
        if(error.message==="Комната закрыта. Создай новую."&&this.state.room){this.update({room:{...this.state.room,status:"closed"}});this.disconnect();}
        if(error.code==="42501")this.disconnect();
        throw new Error(/fetch|abort|timeout|network|Load failed/i.test(error.message)?"Нет связи с сервером. Проверь интернет и повтори.":error.message);
      }
      const room=readCoopRoom(data);if(!room)throw new Error("Сервер комнаты вернул несовместимые данные. Обнови игру.");
      if(this.stopped)return room;
      if(room.host_id!==this.userId&&room.guest_id!==this.userId&&action!=="leave")throw new Error("Ты больше не участник комнаты.");
      this.remember(room);this.update({room,error:""});
      if(room.status==="closed")this.disconnect();
      return room;
    };
    const next=this.requestQueue.then(run,run);this.requestQueue=next.catch(()=>{});return next;
  }
  async enter(action:"create"|"join",code=""){
    if(this.state.busy)return;
    this.update({busy:true,error:""});
    try{
      if(typeof navigator!=="undefined"&&navigator.onLine===false)throw new Error("Для игры вдвоём нужен интернет. Подключись к сети и повтори.");
      const {data,error}=await this.client.auth.getSession();
      if(error||data.session?.user.id!==this.userId)throw new Error("Для игры вдвоём нужен интернет и действующий вход в аккаунт.");
      await this.client.realtime.setAuth(data.session.access_token);
      const room=await this.command(action,normalizeCoopCode(code));
      if(!this.stopped){this.connect(room);this.startTimers();}
    }catch(error){this.update({error:error instanceof Error?error.message:"Не удалось подключиться. Повтори."});}
    finally{this.update({busy:false});}
  }
  async act(action:"ready"|"start"|"lobby"){
    if(this.state.busy)return;
    this.update({busy:true,error:""});
    try{await this.command(action);this.send({type:"room-updated"});}
    catch(error){this.update({error:error instanceof Error?error.message:"Не удалось выполнить действие."});}
    finally{this.update({busy:false});}
  }
  private connect(room:CoopRoom){
    this.disconnect();this.connectingId=room.id;this.peerAt=-Infinity;const version=this.channelVersion;
    this.channels=(["host","guest"] as const).map((role,index)=>{
      const channel=this.client.channel(`go-coop:${room.id}:${role}`,{config:{private:true,broadcast:{self:false,ack:false},presence:{key:this.userId}}});
      channel.on("broadcast",{event:"packet"},({payload})=>{if(index!==this.slot&&this.channelVersion===version&&!this.stopped)this.receive(payload);});
      channel.subscribe(status=>{
        if(this.stopped||this.connectingId!==room.id||this.channelVersion!==version)return;
        this.joined[index]=status==="SUBSCRIBED";
        this.update({connected:this.joined.every(Boolean)});
        if(status==="SUBSCRIBED"&&index===this.slot){void channel.track({userId:this.userId,visible:!document.hidden});this.sendHello();}
      });return channel;
    });
  }
  private disconnect(){
    this.channelVersion++;this.connectingId="";this.joined=[false,false];
    for(const channel of this.channels)void this.client.removeChannel(channel);
    this.channels=[];this.update({connected:false,peerOnline:false});
  }
  private receive(value:unknown){
    if(!value||typeof value!=="object"||!this.state.room)return;
    const packet=value as CoopPacket;
    if(packet.v!==COOP_PROTOCOL){this.update({error:"У напарника другая версия игры. Обновите игру на обоих устройствах."});return;}
    this.peerAt=performance.now();
    if(packet.type==="hello")this.update({peerOnline:true,peerVisible:packet.visible===true});
    else if(packet.type==="bye")this.update({peerOnline:false,peerVisible:false});
    if(packet.type==="ping"&&typeof packet.at==="number")this.send({type:"pong",at:packet.at});
    if(packet.type==="pong"&&packet.at===this.pendingPing){const latency=Math.round(performance.now()-this.pendingPing);this.update({latency:Math.min(10000,latency)});}
    if(packet.type==="room-updated")void this.refresh(true);
    for(const listener of this.packetListeners)listener(packet);
  }
  send(packet:{type:string;[key:string]:unknown}){
    const room=this.state.room,channel=this.channels[this.slot];
    if(this.stopped||!room||!this.joined[this.slot]||!channel)return;
    void channel.send({type:"broadcast",event:"packet",payload:{...packet,v:COOP_PROTOCOL,round:room.round}}).catch(()=>{});
  }
  private sendHello(){this.send({type:"hello",visible:!document.hidden});}
  private async refresh(force=false){
    const now=performance.now();if(now-this.refreshAt<(force?150:1000)||!this.state.room||this.stopped)return;
    this.refreshAt=now;
    try{await this.command("heartbeat");}catch(error){this.update({error:error instanceof Error?error.message:"Нет связи с сервером комнаты."});}
  }
  private startTimers(){
    if(this.timer)return;
    document.addEventListener("visibilitychange",this.visibility);
    this.timer=setInterval(()=>{
      if(this.stopped||!this.state.room||this.state.room.status==="closed")return;
      this.sendHello();
      const online=performance.now()-this.peerAt<COOP_STALE_MS;
      if(online!==this.state.peerOnline)this.update({peerOnline:online});
      if(performance.now()-this.refreshAt>5000)void this.refresh();
      if(performance.now()-this.pingAt>2000){this.pingAt=this.pendingPing=performance.now();this.send({type:"ping",at:this.pendingPing});}
    },500);
  }
  async leave(){
    this.send({type:"bye"});
    try{if(this.state.room&&this.state.room.status!=="closed")await this.command("leave");}
    catch{/* A disconnected tab releases its lease after 15 seconds. */}
    try{sessionStorage.removeItem(coopSessionKey(this.userId));if(this.state.room)sessionStorage.removeItem(coopWorldKey(this.state.room));}catch{}
    this.dispose();
  }
  dispose(){
    if(this.stopped)return;
    this.send({type:"bye"});
    if(this.timer)clearInterval(this.timer);this.timer=null;
    document.removeEventListener("visibilitychange",this.visibility);
    this.disconnect();this.stopped=true;this.listeners.clear();this.packetListeners.clear();
  }
}
