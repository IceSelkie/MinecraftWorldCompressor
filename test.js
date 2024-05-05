eval(""+fs.readFileSync("./readMca.js"));

fname = "test_world_t2/region/r.0.0.mca";
chunk = readNbt(getRegionData(fname)[0].raw)[""];
section = chunk.sections[4];
goal = (parseSector(section.block_states));
testVal = (unpackDenseArray(section.block_states.data, bitsFromPaletteLength(section.block_states.palette.length, 4), 4096));
console.log(JSON.stringify(goal) == JSON.stringify(testVal));
null

readNbt(nbtSerializeValue(TAG_Compound,[['Byte Array',TAG_Byte_Array, [1,2,3,15]]], Buffer.from([TAG_Compound,0,0]), {offset:3}));

