eval(""+fs.readFileSync("./readMca.js"));

fname = "test_world_t2/region/r.0.0.mca";
chunk = nbtToJsonLossy(getRegionData(fname)[0].raw)[""];
section = chunk.sections[4];
null