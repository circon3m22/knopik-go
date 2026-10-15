import {readFile} from 'node:fs/promises';
import sharp from 'sharp';
// go-cover.png is the editable 512px master; optionally pass a newly drawn source.
const source=await readFile(process.argv[2]??'public/go-cover.png');
for(const [file,size]of [['go-cover.png',512],['go-512.png',512],['go-192.png',192],['go-apple-touch.png',180]]){
 await sharp(source).resize(size,size,{kernel:'nearest'}).png({compressionLevel:9}).toFile('public/'+file);
}
