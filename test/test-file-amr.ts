import { assert } from 'chai';
import * as mm from '../lib';
import * as path from 'path';

describe('Parse Adaptive Multi-Rate (AMR) audio codec', () => {

  const amrSamplePath = path.join(__dirname, 'samples', 'amr');

  it('Decode AMR file', async () => {
    const  {format} = await mm.parseFile(path.join(amrSamplePath, 'sample.amr'), {duration: true});
    assert.strictEqual(format.sampleRate, 8000, 'format.sampleRate');
    assert.strictEqual(format.numberOfChannels, 1, 'format.numberOfChannels');
    assert.strictEqual(format.bitrate, 64000, 'format.bitrate');
    assert.approximately(format.duration, 35.340, 0.0005, 'format.duration');
  });

});
