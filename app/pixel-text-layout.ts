/** Tiny5 advances from the bundled OFL font. Unknown glyphs reserve a full em. */
const advances=new Map<string,number>();
for(const ch of " !',.:;Iil|ІЇії·")advances.set(ch,0.25);
for(const ch of "()/[\\]`fjrtгѓј")advances.set(ch,0.375);
for(const ch of "\"$*+-0123456789<=>?JT^_abcdeghknopqsuvxyz{}ЈТабвезкнопрстухцчьэяѐёєѕќўџ")advances.set(ch,0.5);
for(const ch of "%&@ABCDEFGHKLNOPQRSUZ~ЀЁЃЄЅЋЌЍЎЏАБВГЕЗИЙКЛНОПРСУЦЧЬЭЯдийлъыђћѝ")advances.set(ch,0.625);
for(const ch of "#MVWXYmwЂДМФХШЩЪЫжмфшщюњ")advances.set(ch,0.75);
for(const ch of "Юљ")advances.set(ch,0.875);
for(const ch of "ЉЊЖ")advances.set(ch,1.0);

export function pixelTextWidth(text:string,font=1){
 let width=0;for(const ch of text)width+=advances.get(ch)??1;return width*font;
}
/** Keep complete labels inside their signs, including wide Cyrillic glyphs. */
export function layoutPixelText(text:string,width:number,height:number,maxFont:number,maxLines=2){
 const words=text.trim().split(/\s+/),longest=Math.max(...words.map(w=>pixelTextWidth(w)),1);
 let font=Math.min(maxFont,width/longest);
 for(;font>8;font-=.5){
  const lines:string[]=[];
  for(const word of words){const last=lines.length-1;if(last>=0&&pixelTextWidth(`${lines[last]} ${word}`,font)<=width)lines[last]+=` ${word}`;else lines.push(word);}
  if(lines.length<=maxLines&&lines.length*font*1.1<=height)return {lines,font,lineHeight:font*1.1};
 }
 const fallback=Math.min(8,width/pixelTextWidth(text));
 return {lines:[text],font:fallback,lineHeight:fallback*1.1};
}
