fs = require("fs");
path = require("path");
zlib = require("zlib"); null;
eval(""+fs.readFileSync("./nbt.js"));
eval(""+fs.readFileSync("./nbtModify.js"));
eval(""+fs.readFileSync("./nbtSerialize.js"));

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
    return new Array(4096).fill(0);
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
  return parsedSector;
}

// readNbt(getRegionData(fname)[0].raw)[""].sections.map(a=>a.block_states)
// time(()=>_.map(parseSector)) ; null




function bitsFromPaletteLength(paletteLength, minimum=1) {
  return Math.max(minimum, Math.ceil(Math.log(paletteLength)/Math.log(2)));
}

function unpackDenseArray(nums, bitsPerObj, expectedQty, bitsPerNumber=64) {
  if (bitsPerNumber==64)
    return unpackDenseArrayLongs(nums,bitsPerObj,expectedQty);

  let objsPerNumber = Math.floor(bitsPerNumber/bitsPerObj);
  let groupBitsRegex = RegExp(`(${".".repeat(bitsPerObj)})`);

  let mask = Number((1n<<BigInt(bitsPerObj))-1n);
  let ret = new Array(expectedQty).fill(null);
  let index=0;
  for (let i=0; i<nums.length && index<expectedQty; i++) {
    let curr = nums[i];
    for (j=0; j<objsPerNumber && index<expectedQty; j++) {
      ret[index++] = curr & mask;
      curr>>>=bitsPerObj;
    }
  }
  return ret;
  // Equivilant Slow Version:
  // return nums.map(oneNum=>
  //   oneNum.toString(2).padStart(bitsPerNumber,"0")
  //   .slice(bitsPerNumber-objsPerNumber*bitsPerObj)
  //   .split(groupBitsRegex).filter(a=>a)
  //   .reverse()
  // ).flat().slice(0,expectedQty)
  // .map(binaryString=>Number.parseInt(binaryString,2));
}
function unpackDenseArrayLongs(nums, bitsPerObj, expectedQty) {
  let objsPerNumber = Math.floor(64/bitsPerObj);
  let groupBitsRegex = RegExp(`(${".".repeat(bitsPerObj)})`);
  bitsPerObj = BigInt(bitsPerObj);
  let mask = (1n<<bitsPerObj)-1n;
  let ret = new Array(expectedQty).fill(null);
  let index=0;
  for (let i=0; i<nums.length && index<expectedQty; i++) {
    let curr = nums[i];
    for (j=0; j<objsPerNumber && index<expectedQty; j++) {
      ret[index++] = Number(curr & mask);
      curr>>=bitsPerObj;
    }
  }
  return ret;
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

















