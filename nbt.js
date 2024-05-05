TAG_End = 0;
TAG_Byte = 1;
TAG_Short = 2;
TAG_Int = 3;
TAG_Long = 4;
TAG_Float = 5;
TAG_Double = 6;
TAG_Byte_Array = 7;
TAG_String = 8;
TAG_List = 9;
TAG_Compound = 10;
TAG_Int_Array = 11;
TAG_Long_Array = 12;

TAGNAME = ['TAG_End', 'TAG_Byte', 'TAG_Short', 'TAG_Int', 'TAG_Long', 'TAG_Float', 'TAG_Double', 'TAG_Byte_Array', 'TAG_String', 'TAG_List', 'TAG_Compound', 'TAG_Int_Array', 'TAG_Long_Array'];
TAGSIZE = Object.fromEntries([ [TAG_End, 1], [TAG_Byte, 1], [TAG_Short, 2], [TAG_Int, 4], [TAG_Long, 8], [TAG_Float, 4], [TAG_Double, 8] ]);
TAGLISTTYPE = Object.fromEntries([ [TAG_Byte_Array,TAG_Byte], [TAG_Int_Array,TAG_Int], [TAG_Long_Array,TAG_Long] ]);
TAGLISTMULTI = Object.fromEntries([ [TAG_Byte_Array,1], [TAG_Int_Array,4], [TAG_Long_Array,8] ]);

ENUM_SKIP_ALL_CHILDREN = 'skip';
ENUM_MODIFY_THIS = 'modify';
ENUM_INSPECT_CHILDREN = 'inspect';

function readNbt(buf, offset={offset:0}, returnAsTuple=false) {
  if (buf.length<=offset.offset)
    return null;
  let type = buf.readUInt8(offset.offset++);
  if (type == TAG_End)
    return null;

  let name = readNbtValue(buf, TAG_String, offset);

  if (returnAsTuple)
    return [name, readNbtValue(buf, type, offset)];

  let ret = {};
  ret[name] = readNbtValue(buf, type, offset);
  return ret;
}

function readNbtValue(buf, type, offset={offset:0}) {
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
      val = buf.readBigInt64BE(offset.offset);
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
      while (next = readNbt(buf, offset, true))
        ret.push(next);
      return Object.fromEntries(ret);

    case TAG_Byte_Array: // 7
    case TAG_List: // 9
    case TAG_Int_Array: // 11
    case TAG_Long_Array: // 12
      let contentType = type==TAG_Byte_Array?TAG_Byte : type==TAG_Int_Array?TAG_Int : type==TAG_Long_Array?TAG_Long : readNbtValue(buf, TAG_Byte, offset);
      let count = readNbtValue(buf, TAG_Int, offset);
      ret = new Array(count).fill(null);
      for (let i=0; i<count; i++)
        ret[i] = readNbtValue(buf, contentType, offset);
      return ret;

    default:
      throw new Error(`Not implemented yet: ${type} (readNbtValue)`);
  }
}
