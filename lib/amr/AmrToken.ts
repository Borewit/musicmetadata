import { IGetToken } from 'strtok3/lib/core';
import common from '../common/Util';

interface IFrameHeader {
  frameType: number;
  fqi: boolean;
}

/**
 * ID3v2 header
 * Ref: http://id3.org/id3v2.3.0#ID3v2_header
 * ToDo
 */
export const FrameHeader: IGetToken<IFrameHeader > = {
  len: 1,

  get: (buf, off): IFrameHeader => {
    return {
      // ID3v2/file identifier   "ID3"
      frameType: common.getBitAllignedNumber(buf, off, 4, 4),
      fqi: common.strtokBITSET.get(buf, off, 3)
    };
  }
};
