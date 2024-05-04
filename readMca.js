fs = require("fs");
path = require("path");
zlib = require("zlib"); null;
eval(""+fs.readFileSync("./nbt.js"));


function getChunkAges(fname, ret=[]){
  let buf = fs.readFileSync(fname);
  if (buf.length <= 1024*8) return ret;
  let [regionX, regionZ] = path.parse(fname).name.split(".").slice(1).map(a=>Number(a)*32);
  for (let i=0; i<1024; i++) {
    let x = i%32;
    let z = Math.floor(i/32);
    if (buf.readUInt32BE(i*4)!=0)
      ret.push([`${x+regionX},${z+regionZ}`,new Date(buf.readUInt32BE(4096+i*4)*1000)]);
  }
  return ret;
}








function parseSector({palette, data}) {
  if (palette.length == 1)
    return new Array(4096).fill(palette[0]);
  let bitsPerBlock = Math.max(4,Math.ceil(Math.log(palette.length)/Math.log(2)));
  let blocksPerLong = Math.floor(64/bitsPerBlock);
  let parsedSector = data.map(a=>
    // to Binary string
    a.toString(2).padStart(64,"0")
    // take substring with blocks
    .slice(64-blocksPerLong*bitsPerBlock)
    // Split into strings of length ${bitsPerBlock}
    .split(RegExp(`(${".".repeat(bitsPerBlock)})`)).filter(a=>a)
    // Reverse to read blocks from lowest bits to highest bits
    .reverse())
    // Ignore any beyond the last block in the chunk
    .flat().slice(0,4096)
    // Convert back to integer values
    .map(a=>Number.parseInt(a,2))
    // Index back into palette
    .map(a=>palette[a]);
  return parsedSector;
}

// nbtToJsonLossy(getRegionData(fname)[0].raw)[""].sections.map(a=>a.block_states)
// time(()=>_.map(parseSector)) ; null





function unpackDenseArray(arr, bitsPerObj=4, expectedQty=4096, bitsPerNumber=64) {
  return null;
}







function getRegionData(fname) {
  let data = fs.readFileSync(fname)
  let locations = data.slice(0,1024*4);
  let timestamps = data.slice(1024*4,8*1024);
  let chunkData = new Array(1024).fill(null).map((_,i)=>{return{offset:locations.readUInt32BE(i*4)>>8,len:locations.readUInt8(i*4+3),timestamp:new Date(timestamps.readUInt32BE(i*4)*1000)}});
  chunkData = chunkData.map(({offset,len,timestamp},i)=>{
    let x = i%32;
    let z = Math.floor(i/32);
    let pos = `${x},${z}`
    let exists = offset!=0 || len !=0;
    if (!exists) return {pos}
    let bytes = data.readUInt32BE(offset*4*1024);
    if (4096*len < bytes)
      console.log(`Read error: more bytes in chunk than space in sectors ${len} sectors for ${bytes} bytes.`);
    if (bytes+4 < 4096*(len-1))
      console.log(`Read error: sector count higher than needed for bytes. ${len} sectors for ${bytes} bytes.`);
    let compression = data.readUInt8(offset*4*1024+4);
    if (compression!=2) console.error(`Unknown compression scheme: ${compression}`);
    let compressed = data.slice(offset*4*1024+5,offset*4*1024+4+bytes);
    // return {pos,bytes,timestamp,compression};
    let raw = compression==2?zlib.inflateSync(compressed):null;
    return {pos,bytes,timestamp,compression,raw};
  });
  return chunkData;
}

















