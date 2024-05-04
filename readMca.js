fs = require("fs");
path = require("path");
zlib = require("zlib"); null;


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


function toSvg(ages) {
  ages = ages.map(a=>[...a[0].split(",").map(Number), a[1]]);
  const boarderSize = 5;
  let xmin = ages.map(a=>a[0]).reduce((a,b)=>Math.min(a,b)) - 2*boarderSize;
  let xmax = ages.map(a=>a[0]).reduce((a,b)=>Math.max(a,b)) + 2*boarderSize;
  let zmin = ages.map(a=>a[1]).reduce((a,b)=>Math.min(a,b)) - 2*boarderSize;
  let zmax = ages.map(a=>a[1]).reduce((a,b)=>Math.max(a,b)) + 2*boarderSize;
  let tmin = ages.map(a=>a[2]).reduce((a,b)=>Math.min(a,b));
  let trange = ages.map(a=>a[2]).reduce((a,b)=>Math.max(a,b)) - tmin;
  console.log({xmin,xmax,zmin,zmax,tmin,trange});
  ages.sort((a,b)=>b[2]-a[2]);
  let start = `<svg width="${xmax-xmin+1}" height="${zmax-zmin+1}" viewBox="${xmin} ${zmin} ${xmax-xmin+1} ${zmax-zmin+1}" xmlns="http://www.w3.org/2000/svg">`;
  let end = `</svg>`;
  let ret = [
    `<rect x="${xmin-(50*boarderSize)}" y="${zmin-(50*boarderSize)}" width="${xmax-xmin+1+(100*boarderSize)}" height="${zmax-zmin+1+(100*boarderSize)}" fill="black" />`,
    `<rect x="${xmin+boarderSize}" y="${zmin+boarderSize}" width="${xmax-xmin+1-(2*boarderSize)}" height="${zmax-zmin+1-(2*boarderSize)}" fill="gray" />`
    ];
  ages.forEach(([x,y,time],i)=>{
    // Index Based (time-nonlinear)
    let t = (ages.length-i)/(ages.length-1);
    // Time Based (time-linear)
    // // let t = (time-tmin) / trange;
    let fillColor = `rgb(${Math.round(255*(1-t))},${Math.round(255*t)},0)`;
    ret.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="${fillColor}" />`);
  });
  return `${start}\n  ${ret.join("\n  ")}\n${end}`;
}

const TAG_End = 0;
const TAG_Byte = 1;
const TAG_Short = 2;
const TAG_Int = 3;
const TAG_Long = 4;
const TAG_Float = 5;
const TAG_Double = 6;
const TAG_Byte_Array = 7;
const TAG_String = 8;
const TAG_List = 9;
const TAG_Compound = 10;
const TAG_Int_Array = 11;
const TAG_Long_Array = 12;

function readValue(buf, type, offset) {
  if (type == 0)
    return null;
  if (type > 12)
    throw new Error(`Invalid tag type: ${type}`);

  let val, ret;
  switch (type) {
    case TAG_Byte: // 1
      return buf.readInt8(offset.offset++);
    case TAG_Short: // 2
      val = buf.readInt16BE(offset.offset);
      offset.offset += 2;
      return val;
    case TAG_Int: // 3
      val = buf.readInt32BE(offset.offset);
      offset.offset+=4;
      return val;
    case TAG_Long: // 4
      val = Number(buf.readBigInt64BE(offset.offset));
      offset.offset+=8;
      return val;

    case TAG_Float: // 5
      val = buf.readFloatBE(offset.offset);
      offset.offset += 4;
      return val;
    case TAG_Double: // 6
      val = buf.readDoubleBE(offset.offset);
      offset.offset += 8;
      return val;

    case TAG_String: //8
      let strLen = buf.readUInt16BE(offset.offset);
      offset.offset += 2;
      let str = buf.slice(offset.offset, offset.offset+strLen).toString("utf-8");
      offset.offset += strLen;
      return str;

    case TAG_Compound: // 10
      ret = [];
      while (next = nbtToJsonLossy(buf, offset, true))
        ret.push(next);
      return Object.fromEntries(ret);

    case TAG_Byte_Array: // 7
    case TAG_List: // 9
    case TAG_Int_Array: // 11
    case TAG_Long_Array: // 12
      let contentType = type==TAG_Byte_Array?TAG_Byte : type==TAG_Int_Array?TAG_Int : type==TAG_Long_Array?TAG_Long : readValue(buf, TAG_Byte, offset);
      let count = readValue(buf, TAG_Int, offset);
      ret = new Array(count).fill(null);
      for (let i=0; i<count; i++)
        ret[i] = readValue(buf, contentType, offset);
      return ret;

    default:
      throw new Error(`Not implemented yet: ${type} (readValue)`);
  }
}

function nbtToJsonLossy(buf, offset={offset:0}, rawArray=false) {
  // console.log(`Starting nbtToJsonLossy with offset ${offset.offset}`);
  if (buf.length<=offset.offset)
    return null;

  let type = buf.readUInt8(offset.offset++);

  if (type == TAG_End)
    return null;

  let name = readValue(buf, 8, offset);
  // console.log(` -> nbtToJsonLossy tag ${type} with name ${JSON.stringify(name)}. Content starting at ${offset.offset}.`);

  if (rawArray)
    return [name, readValue(buf, type, offset)];

  let ret = {};
  ret[name] = readValue(buf, type, offset);
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

















