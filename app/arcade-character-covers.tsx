/** Two authored character posters on a 256×160 pixel grid. */
function Sneaker({x,y,far=false}:{x:number;y:number;far?:boolean}){
 return <g transform={`translate(${x} ${y})`} data-cover-sneaker=""><path d="M-11-18H5v5h8v4h8v5h3V3H-17V-7h3v-6h3Z" fill="#223c58"/><path d="M-9-16H3v6h8v4h9V0H-14V-6h3v-6h2Z" fill={far?'#45658b':'#537eaf'}/><path d="M-7-14H0v5h8v3h-18v-6h3Z" fill="#789dc1"/><path d="M-16-1h39v5h-39Z" fill="#e5e9dc"/><path d="M-16 3h39v2h-39Z" fill="#788f9c"/><path d="M-5-9H4v2H-5Zm3 4H8v2H-2Zm16 2h5v2h-5Z" fill="#e9ebdb"/><path d="M-12 0h3v2h-3Zm6 0h3v2h-3Zm25 0h2v2h-2Z" fill="#a9b7bb"/></g>;
}
export function ShoesInSeaCover(){return <g data-cover-character="three-sneaker-shark">
 <path d="M0 0h256v160H0Z" fill="#9dbbbd"/><path d="M0 48h256v61H0Z" fill="#5c9baa"/><path d="M0 67h256v30H0Z" fill="#408093"/>
 <path d="M8 22h8v-4h29v4h15v5H8Zm169-9h24v4h20v6h-48v-6h4Zm28 25h37v4h-37Z" fill="#d8dfce"/>
 <path d="M0 51h38v-7h18v-6h30v7h13v6h28v5H0Z" fill="#5f8f8b"/><path d="M39 44h17v-4h30v4h-47Z" fill="#8da89a"/>
 <path d="M0 91h56v4h48v-3h54v-6h45v-4h53v78H0Z" fill="#d0bc90"/>
 <path d="M0 93h55v4h50v-2h53v-6h45v-5h53v6h-47v5h-46v6h-55v2H50v-4H0Z" fill="#e5dfb8"/>
 <path d="M0 104h63v3h52v-3h49v-4h43v-4h49v5h-47v5h-43v4h-50v3H60v-3H0Z" fill="#b5b58f"/>
 <path d="M10 70h29v2H10Zm43 12h37v2H53Zm119-20h36v2h-36Zm35 10h35v2h-35Z" fill="#bed8cf"/>
 <path d="M59 138h128v4H59Zm18 4h82v3H77Z" fill="#918d72" opacity=".55"/>
 {/* The far leg is behind the body, with its own third shoe. */}
 <path d="M151 99h10v20h-10Z" fill="#3b6a7a"/><Sneaker x={157} y={126} far/>
 {/* Tail, dorsal fin and body retain a stepped organic silhouette. */}
 <path d="M70 68H53V57H42v-9H30v23h8v11h-8v20h13V91h12V80h15Z" fill="#264d62"/>
 <path d="M67 70H51V60H41V54h-7v16h8v11h-8v14h7V85h12V77h14Z" fill="#5f8d9e"/>
 <path d="M91 63V48h8V35h9v6h7v12h6v14Z" fill="#264d62"/>
 <path d="M95 63V49h8V41h3v9h7v12Z" fill="#85a8af"/>
 <path d="M63 64h29v-6h44v5h29v7h20v7h18v7h15v10h-10v8h-17v9h-29v6H96v-5H76v-8H64V93h-8V76h7Z" fill="#264d62"/>
 <path d="M66 67h28v-6h40v5h28v7h20v7h18v7h14v5h-10v8h-16v8h-28v6H98v-5H79v-8H67V91h-8V78h7Z" fill="#6595a4"/>
 <path d="M79 66h19v-3h34v5h27v7h19v6h-31v-4h-43v4H79Z" fill="#8bafb7"/>
 <path d="M68 88h16v5h26v5h41v-4h28v-4h24v8h-17v8h-27v6H99v-5H81v-8H69Z" fill="#c4d4ce"/>
 <path d="M94 92h9v-3h14v3h-7v10h-7v10h-8v-7h-6v-7h5Z" fill="#416e82"/>
 <path d="M98 93h9v5h-5v8h-4Z" fill="#7c9faa"/>
 <path d="M159 77h9v9h-9Z" fill="#294554"/><path d="M160 77h4v4h-4Z" fill="#eceddc"/>
 <path d="M179 89h30v4h-9v4h-26v-4h5Z" fill="#294554"/>
 <path d="M181 91h4v4h-4Zm8 0h4v4h-4Zm8 0h4v3h-4Z" fill="#e8e7d3"/>
 <path d="M129 78h3v11h-3Zm7 1h3v11h-3Zm7 2h3v10h-3Z" fill="#3e6b7e"/>
 <path d="M102 68h4v2h-4Zm13 3h6v2h-6Zm-36 9h4v2h-4Zm74-10h5v2h-5Z" fill="#a6c2c1"/>
 {/* Two near legs carry the shark above three clearly blue trainers. */}
 <path d="M84 106h12v19h-12Zm37 5h13v19h-13Z" fill="#315c72"/>
 <path d="M87 109h6v17h-6Zm37 5h7v17h-7Z" fill="#83a9b3"/>
 <Sneaker x={88} y={137}/><Sneaker x={128} y={144}/>
 <path d="M16 139h12v3H16Zm170 10h25v2h-25Zm-11-13h7v2h-7Zm55-14h9v2h-9Z" fill="#ac9d7a"/>
 <path d="M219 137h6v-3h8v3h4v5h-18Z" fill="#e7d7ae"/><path d="M225 136h2v5h-2Zm5 1h2v4h-2Z" fill="#b19c7a"/>
 <path d="M15 115h4v13h-4Zm4 4h6v3h-6Zm-9 3h5v3h-5Z" fill="#7d9980"/>
 </g>;}
export function CappuccinoRhythmCover(){return <g data-cover-character="cappuccino-ballerina">
 <path d="M0 0h256v160H0Z" fill="#302c43"/>
 <path d="M27 12h202v102H27Z" fill="#48415d"/><path d="M57 20h143v81H57Z" fill="#62516d"/>
 <path d="M66 23h5v77h-5Zm60 0h3v77h-3Zm61 0h5v77h-5Z" fill="#7b6684"/>
 <path d="M0 0h51v15H39v17H28v22H16v45H0Zm256 0h-43v18h10v22h12v61h21Z" fill="#885472"/>
 <path d="M4 4h9v91H4Zm16 0h7v44h-7Zm16 0h7v13h-7Zm199 0h7v90h-7Zm13 0h5v91h-5Z" fill="#ac7890"/>
 <path d="M0 4h256v9h-20v6h-35v-6h-32v7h-36v-7h-34v6H65v-6H30v6H0Z" fill="#6e4868"/>
 <path d="M0 109h256v51H0Z" fill="#a37f85"/><path d="M0 112h256v3H0Zm0 27h256v2H0Zm0 16h256v2H0Z" fill="#6b576b"/>
 <path d="M25 114h2v25h-2Zm55 0h2v25h-2Zm74 0h2v25h-2Zm65 0h2v25h-2ZM45 141h2v14h-2Zm70 0h2v14h-2Zm77 0h2v14h-2Z" fill="#836477"/>
 <path d="M94 116h100v3H94Zm9 3h79v3h-79Z" fill="#bea394" opacity=".4"/>
 {/* A small piano puts the rhythm setting into the picture. */}
 <path d="M12 83h50v8h9v33H12Z" fill="#293040"/><path d="M16 87h43v5H16Z" fill="#b49491"/>
 <path d="M15 98h48v13H15Z" fill="#e9dfc5"/><path d="M20 98h2v13h-2Zm8 0h2v13h-2Zm8 0h2v13h-2Zm8 0h2v13h-2Zm8 0h2v13h-2Z" fill="#8e8a88"/>
 <path d="M20 98h4v8h-4Zm9 0h4v8h-4Zm17 0h4v8h-4Zm9 0h4v8h-4Z" fill="#343744"/>
 <path d="M17 123h6v23h-6Zm36 0h6v23h-6Z" fill="#3c3447"/><path d="M25 75h27v15H25Z" fill="#d8c8ad"/>
 <path d="M30 79h7v2h-7Zm10 0h7v2h-7Zm-10 5h17v1H30Z" fill="#8c7c78"/>
 {/* Pointed feet: one supports her, the other extends to the side. */}
 <path d="M128 98h9v30h-3v13h-6v-16h-3v-21Z" fill="#bc8d91"/>
 <path d="M129 105h5v23h-3v11h-3v-15h-1Z" fill="#efd3ba"/>
 <path d="M128 132h9v12h-4v5h-8v-7h3Z" fill="#b77795"/><path d="M128 137h5v8h-5Z" fill="#e6b2c3"/>
 <path d="M124 101v8h-10v7H99v5H85v-6h12v-6h14v-8Z" fill="#bc8d91"/>
 <path d="M121 103v4h-10v6H97v5H87v-2h10v-6h15v-7Z" fill="#efd3ba"/>
 <path d="M84 112h10v5H83v3H72v-4h6v-4Z" fill="#c487a2"/><path d="M79 116h11v2H79Z" fill="#edc0cc"/>
 {/* Bent arms frame a real ceramic cup, rather than a rectangular icon. */}
 <path d="M115 72h-10v-7h-8v-9h-5V43h6v11h5v8h10v5h8Z" fill="#be9292"/>
 <path d="M116 69h-9v-7h-7v-8h-5v-9h2v10h5v8h9v5h5Z" fill="#f0d2bd"/>
 <path d="M145 71h11v-8h8v-8h5v-8h6v12h-7v8h-8v9h-14Z" fill="#bd9093"/>
 <path d="M148 71h8v-9h8v-8h6v-6h3v9h-7v8h-8v9h-10Z" fill="#efd2bb"/>
 <path d="M92 40h7v7h-7Zm77 3h8v7h-8Z" fill="#f0d5c1"/>
 <path d="M114 69h31v10h-3v14h-24V79h-4Z" fill="#a76d8b"/><path d="M117 71h26v8h-4v12h-18V79h-4Z" fill="#d7a1b5"/>
 <path d="M118 73h8v3h8v-3h7v5h-7v3h-8v-3h-8Z" fill="#f0c8d0"/><path d="M128 80h4v8h-4Z" fill="#b57e9e"/>
 <path d="M116 88h28v6h8v5h10v5h-9v7h-13v-5h-11v6h-12v-6h-14v-6h-9v-5h12v-4h10Z" fill="#9a6e90"/>
 <path d="M117 89h26v6h8v5h8v3h-16v-3h-12v6h-12v-5h-14v-4h10Z" fill="#d8a7c0"/>
 <path d="M123 91h5v9h-5Zm11 1h5v6h-5Zm-21 5h5v4h-5Zm31 2h5v3h-5Z" fill="#f0ccda"/>
 {/* Handle, cup walls and the stepped oval rim. */}
 <path d="M151 36h15v5h6v20h-6v6h-15v-6h11v-3h4V44h-4v-2h-11Z" fill="#b6a19a"/>
 <path d="M152 38h12v5h5v16h-5v5h-11v-3h9v-5h4V45h-5v-4h-9Z" fill="#edddc4"/>
 <path d="M98 33h59v27h-5v9h-11v4h-28v-4h-10v-9h-5Z" fill="#a78b88"/>
 <path d="M101 35h53v23h-5v9h-10v3h-24v-4h-9v-8h-5Z" fill="#e4ceb2"/>
 <path d="M104 38h12v24h8v7h-9v-4h-8v-8h-3Z" fill="#f3e3c6"/>
 <path d="M145 39h7v18h-5v8h-9v3h-6v-4h9v-7h4Z" fill="#c8af9e"/>
 <path d="M108 25h39v3h9v5h4v5h-6v5h-11v3h-30v-3h-11v-5h-6v-6h5v-4h7Z" fill="#f2dfc0"/>
 <path d="M109 29h36v3h9v6h-10v4h-31v-4h-10v-5h6Z" fill="#98705f"/>
 <path d="M113 31h27v2h8v4h-9v3h-22v-3h-8v-3h4Z" fill="#c9a280"/>
 <path d="M119 32h6v2h4v-2h7v3h-3v3h-5v2h-4v-2h-5v-2h-3v-2h3Z" fill="#f0dcc0"/>
 <path d="M112 50h7v8h-7Zm24 0h7v8h-7Z" fill="#5b484c"/><path d="M113 50h3v3h-3Zm24 0h3v3h-3Z" fill="#fff0d4"/>
 <path d="M121 61h3v2h8v-2h3v4h-3v2h-8v-2h-3Z" fill="#a87778"/>
 <path d="M203 55h4v16h-10v-6h6Zm4 0h9v3h-9Zm-26 36h4v14h-9v-5h5Z" fill="#d1acc5"/>
 <path d="M16 151h15v4H16Zm50 0h15v4H66Zm115 0h15v4h-15Zm47 0h14v4h-14Z" fill="#dfbc97"/>
 </g>;}
