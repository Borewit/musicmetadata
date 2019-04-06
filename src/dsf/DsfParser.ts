'use strict';

import { AbstractID3Parser } from '../id3v2/AbstractID3Parser';
import * as assert from 'assert';

import * as _debug from 'debug';
import {ChunkHeader, DsdChunk, FormatChunk, IChunkHeader, IDsdChunk} from "./DsfChunk";
import {ID3v2Parser} from "../id3v2/ID3v2Parser";

const debug = _debug('music-metadata:parser:DSF');

/**
 * DSF (dsd stream file) File Parser
 * Ref: https://dsd-guide.com/sites/default/files/white-papers/DSFFileFormatSpec_E.pdf
 */
export class DsfParser extends AbstractID3Parser {

  public async _parse(): Promise<void> {

    const chunkHeader = await this.tokenizer.readToken<IChunkHeader>(ChunkHeader);
    assert.strictEqual(chunkHeader.id, 'DSD ');
    this.metadata.setFormat('dataformat', 'DSF');
    const dsdChunk = await this.tokenizer.readToken<IDsdChunk>(DsdChunk);
    if (dsdChunk.metadataPointer === 0) {
      debug(`No ID3v2 tag present`);
    } else {
      debug(`expect ID3v2 at offset=${dsdChunk.metadataPointer}`);
      await this.parseChunks();
      // Jump to ID3 header
      this.tokenizer.ignore(dsdChunk.metadataPointer - this.tokenizer.position);
      return new ID3v2Parser().parse(this.metadata, this.tokenizer, this.options);
    }
  }

  private async parseChunks() {
    const chunkHeader = await this.tokenizer.readToken<IChunkHeader>(ChunkHeader);
    debug(`Parsing chunk name=${chunkHeader.id} size=${chunkHeader.size}`);
    switch (chunkHeader.id) {
      case 'fmt ':
        const formatChunk = await this.tokenizer.readToken(FormatChunk);
        this.metadata.setFormat('numberOfChannels', formatChunk.channelNum);
        this.metadata.setFormat('sampleRate', formatChunk.samplingFrequency);
        this.metadata.setFormat('bitsPerSample', formatChunk.bitsPerSample);
        this.metadata.setFormat('numberOfSamples', formatChunk.sampleCount);
        this.metadata.setFormat('duration', formatChunk.sampleCount / formatChunk.samplingFrequency);
        return;
      default:
        this.tokenizer.ignore(chunkHeader.size - ChunkHeader.len);
        break;
    }
  }
}
