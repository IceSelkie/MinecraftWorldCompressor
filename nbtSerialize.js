

function guesstimateSerializedSize(type, dat){
  let ret = TAGSIZE[type];
  if (ret) return ret;
  ret = TAGLISTMULTI[type];
  if (ret) return 4 + ret*dat.length;
  if (type == TAG_String)
    return 2 + Buffer.byteLength(dat, 'utf-8');
  if (type == TAG_Compound)
    dat.reduce((sum, [name, type, entry])=>sum+guesstimateSerializedSize(TAG_String, name)+guesstimateSerializedSize(type, entry), 1);
  return 0;
}

function nbtSerializeValue(type, dat, buf, offset = { offset: 0 }) {
  let approxSize = guesstimateSerializedSize(type, dat);
  // console.log(`Adding ${TAGNAME[type]} (~${approxSize} bytes) at ${offset.offset}...`);
  if (!buf)
    buf = Buffer.alloc(approxSize || 1024);
  else if (approxSize && (buf.length - offset.offset < approxSize)) {
    let newSize = Math.max(20, 2*buf.length, offset.offset+approxSize);
    // console.log(`Expanding array... Buffer ${offset.offset}/${buf.length} cant fit ${approxSize}... Increasing capacity by ${newSize-buf.length} to ${newSize}.`);
    let newBuf = Buffer.alloc(newSize);
    buf.copy(newBuf, 0, 0, offset.offset);
    buf = newBuf;
  }

  switch (type) {
    case TAG_End:
      dat = TAG_End;
    case TAG_Byte:
      buf.writeInt8(Number(dat), offset.offset);
      offset.offset += 1;
      return buf;
    case TAG_Short:
      buf.writeInt16BE(Number(dat), offset.offset);
      offset.offset += 2;
      return buf;
    case TAG_Int:
      buf.writeInt32BE(Number(dat), offset.offset);
      offset.offset += 4;
      return buf;
    case TAG_Long:
      buf.writeBigInt64BE(BigInt(dat), offset.offset);
      offset.offset += 8;
      return buf;

    case TAG_Float:
      buf.writeFloatBE(Number(dat), offset.offset);
      offset.offset += 4;
      return buf;
    case TAG_Double:
      buf.writeDoubleBE(Number(dat), offset.offset);
      offset.offset += 8;
      return buf;

    case TAG_String:
      let strLen = Buffer.byteLength(dat, 'utf-8');
      buf = nbtSerializeValue(TAG_Short, strLen, buf, offset);
      buf.write(dat, offset.offset, 'utf-8');
      offset.offset += strLen;
      return buf;

    case TAG_Byte_Array:
    case TAG_Int_Array:
    case TAG_Long_Array:
      buf = nbtSerializeValue(TAG_Int, dat.length, buf, offset);
      let elementType = TAGLISTTYPE[type];
      dat.forEach(element => {
        buf = nbtSerializeValue(elementType, element, buf, offset);
      });
      return buf;

    case TAG_Compound:
      dat.forEach(([name, type, value]) => {
        buf = nbtSerializeValue(TAG_Byte, type, buf, offset);
        buf = nbtSerializeValue(TAG_String, name, buf, offset);
        buf = nbtSerializeValue(type, value, buf, offset);
      });
      return nbtSerializeValue(TAG_End, null, buf, offset);


    default:
      throw new Error(`Not implemented yet: ${type} (nbtSerializeValue)`);
  }
}

// Test case:
// readNbt(nbtSerializeValue(TAG_Compound,[['Byte Array',TAG_Byte_Array, [1,2,3,15]]], Buffer.from([TAG_Compound,0,0]), {offset:3}));

// function nbtSerializeList(dat, innerType, buf=null, offset = {offset:0}) {}


































