eval(""+fs.readFileSync("./readMca.js"));

fname = "test_world_t2/region/r.0.0.mca";
chunk = nbtToJsonLossy(getRegionData(fname)[0].raw)[""];
section = chunk.sections[4];
goal = (parseSector(section.block_states));
testVal = (unpackDenseArray(section.block_states.data, bitsFromPaletteLength(section.block_states.palette.length, 4), 4096));
console.log(JSON.stringify(goal) == JSON.stringify(testVal));
null
