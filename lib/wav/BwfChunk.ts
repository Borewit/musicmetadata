import { IGetToken } from 'strtok3/lib/core';
import * as Token from 'token-types';

export interface IBroadcastAudioExtensionChunk {
  description: string;
  originator: string;
  originatorReference: string;
  originationDate: string;
  originationTime: string;
  timeReferenceLow: number,
  timeReferenceHigh: number,
  version: number,
  umid: Buffer,
}

/**
 * Broadcast Audio Extension Chunk
 * Ref: https://tech.ebu.ch/docs/tech/tech3285.pdf
 */
export const BroadcastAudioExtensionChunk: IGetToken<IBroadcastAudioExtensionChunk> = {
  len: 420,

  get: (buf, off) => {
    return {
      description: new Token.StringType(256, 'ascii').get(buf, off).trim(),
      originator: new Token.StringType(32, 'ascii').get(buf, off + 256).trim(),
      originatorReference: new Token.StringType(32, 'ascii').get(buf, off + 288).trim(),
      originationDate: new Token.StringType(10, 'ascii').get(buf, off + 320).trim(),
      originationTime: new Token.StringType(8, 'ascii').get(buf, off + 330).trim(),
      timeReferenceLow: Token.UINT32_LE.get(buf, off + 338),
      timeReferenceHigh: Token.UINT32_LE.get(buf, off + 342),
      version: Token.UINT16_LE.get(buf, off + 346),
      umid: new Token.BufferType(64).get(buf, off + 348),
      loudnessValue: Token.UINT16_LE.get(buf, off + 412),
      maxTruePeakLevel: Token.UINT16_LE.get(buf, off + 414),
      maxMomentaryLoudness: Token.UINT16_LE.get(buf, off + 416),
      maxShortTermLoudness: Token.UINT16_LE.get(buf, off + 418)
    };
  }
};
