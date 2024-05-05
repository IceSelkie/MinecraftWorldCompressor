
function modifyNbt(buf, offset={offset:0}, shouldModify=(path)=>ENUM_SKIP_ALL_CHILDREN, modify=(path,type,buf,tagStart,nameStart,datStart,datEnd)=>dat, path=[]) {
  if (buf.length<=offset.offset)
    return null;
  let typeStart = offset.offset;
  let type = buf.readUInt8(offset.offset++);
  if (type == TAG_End)
    return null;

  let name = readNbtValue(buf, TAG_String, offset);
  path.push(name);

  let status = shouldModify(path);
  switch (status) {
    case ENUM_SKIP_ALL_CHILDREN:
      skipNbtValue(buf, type, offset);
      path.pop();
      return false;
    case ENUM_MODIFY_THIS:
      let start = offset.offset;
      skipNbtValue(buf, type, offset);
      let end = offset.offset;
      modify(path, type, buf, typeStart, typeStart+1, start, end);
      path.pop();
      return true;
    case ENUM_INSPECT_CHILDREN:
      let ret = modifyNbtValue(buf, type, offset, shouldModify, modify, path);
      path.pop();
      return ret;
    default:
      throw new Error(`Unexpected shouldModify status: ${status}`);
  }
}

function skipNbtValue(buf, type, offset={offset:0}) {
  if (type == 0)
    offset.offset++;
    return 0;
  if (type > 12)
    throw new Error(`Invalid tag type: ${type}`);

  let contentType, count;
  switch (type) {
    case TAG_Byte: // 1
    case TAG_Short: // 2
    case TAG_Int: // 3
    case TAG_Long: // 4
    case TAG_Float: // 5
    case TAG_Double: // 6
      offset.offset += TAGSIZE[type];
      return offset.offset;

    case TAG_String: //8
      let strLen = buf.readUInt16BE(offset.offset);
      offset.offset += 2 + strLen;
      return offset.offset;

    case TAG_Compound: // 10
      contentType = readNbtValue(buf, TAG_Byte, offset);
      while (contentType != TAG_End) {
        skipNbtValue(buf, TAG_String, offset);
        skipNbtValue(buf, contentType, offset);
        contentType = readNbtValue(buf, TAG_Byte, offset);
      }
      return offset.offset;

    case TAG_Byte_Array: // 7
    case TAG_Int_Array: // 11
    case TAG_Long_Array: // 12
      count = readNbtValue(buf, TAG_Int, offset);
      offset.offset+=count*TAGLISTMULTI[type];
      return offset.offset;

    case TAG_List: // 9
      contentType = readNbtValue(buf, TAG_Byte, offset);
      count = readNbtValue(buf, TAG_Int, offset);
      if (TAGSIZE[contentType]) {
        offset.offset += count * TAGSIZE[contentType];
        return offset.offset;
      }
      for (let i=0; i<count; i++)
        skipNbtValue(buf, contentType, offset);
      return offset.offset;


    default:
      throw new Error(`Not implemented yet: ${type} (skipNbtValue)`);
  }
}

function modifyNbtValue(buf, type, offset={offset:0}, shouldModify=(path)=>ENUM_SKIP_ALL_CHILDREN, modify=(path,buf,start,end)=>dat, path=[]) {
  // if (type == 0)
  //   return null;
  // if (type > 12)
  //   throw new Error(`Invalid tag type: ${type}`);

  // let val, ret;
  switch (type) {
    // case TAG_Byte: // 1
    //   return buf.readInt8(offset.offset++);
    // case TAG_Short: // 2
    //   val = buf.readInt16BE(offset.offset);
    //   offset.offset += 2;
    //   return val;
    // case TAG_Int: // 3
    //   val = buf.readInt32BE(offset.offset);
    //   offset.offset+=4;
    //   return val;
    // case TAG_Long: // 4
    //   val = buf.readBigInt64BE(offset.offset);
    //   offset.offset+=8;
    //   return val;

    // case TAG_Float: // 5
    //   val = buf.readFloatBE(offset.offset);
    //   offset.offset += 4;
    //   return val;
    // case TAG_Double: // 6
    //   val = buf.readDoubleBE(offset.offset);
    //   offset.offset += 8;
    //   return val;

    // case TAG_String: //8
    //   let strLen = buf.readUInt16BE(offset.offset);
    //   offset.offset += 2;
    //   let str = buf.slice(offset.offset, offset.offset+strLen).toString("utf-8");
    //   offset.offset += strLen;
    //   return str;

    // case TAG_Compound: // 10
    //   ret = [];
    //   while (next = readNbt(buf, offset, true))
    //     ret.push(next);
    //   return Object.fromEntries(ret);

    // case TAG_Byte_Array: // 7
    // case TAG_List: // 9
    // case TAG_Int_Array: // 11
    // case TAG_Long_Array: // 12
    //   let contentType = type==TAG_Byte_Array?TAG_Byte : type==TAG_Int_Array?TAG_Int : type==TAG_Long_Array?TAG_Long : readNbtValue(buf, TAG_Byte, offset);
    //   let count = readNbtValue(buf, TAG_Int, offset);
    //   ret = new Array(count).fill(null);
    //   for (let i=0; i<count; i++)
    //     ret[i] = readNbtValue(buf, contentType, offset);
    //   return ret;

    default:
      throw new Error(`Not implemented yet: ${type} (modifyNbtValue)`);
  }
}
