import * as Token from "token-types";
import { IGetToken, ITokenizer } from 'strtok3/lib/core';
import Common from '../common/Util';

export interface IXingHeaderFlags {
  frames: boolean;
  bytes: boolean;
  toc: boolean;
  vbrScale: boolean;
}

/**
 * Info Tag: Xing, LAME
 */
export const InfoTagHeaderTag = new Token.StringType(4, 'ascii');

/**
 * LAME TAG value
 * Did not find any official documentation for this
 * Value e.g.: "3.98.4"
 */
export const LameEncoderVersion = new Token.StringType(6, 'ascii');

export interface IXingInfoTag {

  /**
   * total bit stream frames from Vbr header data
   */
  numFrames?: number,

  /**
   * Actual stream size = file size - header(s) size [bytes]
   */
  streamSize?: number,

  toc?: Buffer;

  /**
   * the number of header data bytes (from original file)
   */
  vbrScale?: number;

  lame?: {
    version: string;
  }
}

/**
 * Info Tag
 * Ref: http://gabriel.mp3-tech.org/mp3infotag.html
 */
export const XingHeaderFlags: IGetToken<IXingHeaderFlags> = {
  len: 4,

  get: (buf, off) => {
    return {
      frames: Common.isBitSet(buf, off, 31),
      bytes: Common.isBitSet(buf, off, 30),
      toc: Common.isBitSet(buf, off, 29),
      vbrScale: Common.isBitSet(buf, off, 28)
    };
  }
};

// /**
//  * XING Header Tag
//  * Ref: http://gabriel.mp3-tech.org/mp3infotag.html
//  */
export async function readXingHeader(tokenizer: ITokenizer): Promise<IXingInfoTag> {
  const flags = await tokenizer.readToken(XingHeaderFlags);
  const xingInfoTag: IXingInfoTag = {};
  if (flags.frames) {
    xingInfoTag.numFrames =  await tokenizer.readToken(Token.UINT32_BE);
  }
  if (flags.bytes) {
    xingInfoTag.streamSize =  await tokenizer.readToken(Token.UINT32_BE);
  }
  if (flags.toc) {
    xingInfoTag.toc = Buffer.alloc(100);
    await tokenizer.readBuffer(xingInfoTag.toc);
  }
  if (flags.vbrScale) {
    xingInfoTag.vbrScale = await tokenizer.readToken(Token.UINT32_BE);
  }
  const lameTag = await tokenizer.peekToken(new Token.StringType(4, 'ascii'));
  if (lameTag === 'LAME') {
    xingInfoTag. lame = {
      version: await tokenizer.readToken(new Token.StringType(9, 'ascii'))
    };
  }
  return xingInfoTag;
}
