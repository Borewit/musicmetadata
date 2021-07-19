import { assert } from 'chai';
import * as mm from '../lib';
import * as path from 'path';
import { Parsers } from './metadata-parsers';
import * as fs from 'fs';

const t = assert;

describe('Parse MPEG-4 files with iTunes metadata', () => {

  const _samples = path.join(__dirname, 'samples');

  const mp4Samples = path.join(_samples, 'mp4');

  describe('Parse MPEG-4 files (.m4a)', () => {

    function checkFormat(format) {
      assert.deepEqual(format.lossless, false);
      assert.deepEqual(format.container, 'M4A/isom/iso2', 'container');
      assert.deepEqual(format.codec, 'MPEG-4/AAC', 'codec');
      assert.deepEqual(format.numberOfChannels, 2, 'format.numberOfChannels');
      assert.deepEqual(format.sampleRate, 44100, 'format.sampleRate');
      assert.deepEqual(format.tagTypes, ['iTunes'], 'format.tagTypes');
      assert.approximately(format.duration, 2.206, 1 / 500, 'format.duration');
      assert.strictEqual(format.sampleRate, 44100, 'format.sampleRate = 44.1 kHz');
      assert.deepEqual(format.bitsPerSample, 16, 'format.bitsPerSample');
      assert.approximately(format.bitrate, 148000, 500, 'Calculate bit-rate');
    }

    function checkCommon(common) {
      t.strictEqual(common.title, 'Voodoo People (Pendulum Remix)', 'title');
      t.strictEqual(common.artist, 'The Prodigy', 'artist');
      t.strictEqual(common.albumartist, 'Pendulum', 'albumartist');
      t.strictEqual(common.album, 'Voodoo People', 'album');
      t.strictEqual(common.year, 2005, 'year');
      t.strictEqual(common.track.no, 1, 'track no');
      t.strictEqual(common.track.of, 12, 'track of');
      t.strictEqual(common.disk.no, 1, 'disk no');
      t.strictEqual(common.disk.of, 1, 'disk of');
      t.strictEqual(common.genre[0], 'Electronic', 'genre');
      t.strictEqual(common.picture[0].format, 'image/jpeg', 'picture 0 format');
      t.strictEqual(common.picture[0].data.length, 196450, 'picture 0 length');
      t.strictEqual(common.picture[1].format, 'image/jpeg', 'picture 1 format');
      t.strictEqual(common.picture[1].data.length, 196450, 'picture 1 length');
    }

    function checkNativeTags(native) {

      t.ok(native, 'Native m4a tags should be present');

      t.deepEqual(native.trkn, ['1/12'], 'm4a.trkn');
      t.deepEqual(native.disk, ['1/1'], 'm4a.disk');
      t.deepEqual(native.tmpo, [0], 'm4a.tmpo');
      t.deepEqual(native.gnre, ['Electronic'], 'm4a.gnre');
      t.deepEqual(native.stik, [1], 'm4a.stik');
      t.deepEqual(native['©alb'], ['Voodoo People'], 'm4a.©alb');
      t.deepEqual(native.aART, ['Pendulum'], 'm4a.aART');
      t.deepEqual(native['©ART'], ['The Prodigy'], 'm4a.©ART');
      t.deepEqual(native['©cmt'], ['(Pendulum Remix)'], 'm4a.©cmt');
      t.deepEqual(native['©wrt'], ['Liam Howlett'], 'm4a.©wrt');
      t.deepEqual(native['----:com.apple.iTunes:iTunNORM'], [' 0000120A 00001299 00007365 0000712F 0002D88B 0002D88B 00007F2B 00007F2C 0003C770 0001F5C7'], 'm4a.----:com.apple.iTunes:iTunNORM');
      t.deepEqual(native['©nam'], ['Voodoo People (Pendulum Remix)'], 'm4a.©nam');
      t.deepEqual(native['©too'], ['Lavf52.36.0'], 'm4a.©too');
      t.deepEqual(native['©day'], ['2005'], 'm4a.@day');

      // Check album art
      t.isDefined(native.covr);
      t.strictEqual(native.covr[0].format, 'image/jpeg', 'm4a.covr.format');
      t.strictEqual(native.covr[0].data.length, 196450, 'm4a.covr.data.length');
    }

    Parsers.forEach(parser => {
      it(parser.description, async () => {

        const filePath = path.join(mp4Samples, 'id4.m4a');

        const metadata = await parser.initParser(filePath, 'audio/mp4');
        const native = metadata.native.iTunes;
        t.ok(native, 'Native m4a tags should be present');

        checkFormat(metadata.format);
        checkCommon(metadata.common);
        checkNativeTags(mm.orderTags(native));
      });
    });
  });

  /**
   * Ref: https://github.com/Borewit/music-metadata/issues/74
   */
  describe('should decode 8-byte unsigned integer', () => {

    Parsers.forEach(parser => {
      it(parser.description, async () => {

        const filePath = path.join(mp4Samples, 'issue-74.m4a');

        const metadata = await parser.initParser(filePath, 'audio/mp4');
        const {format, common, native} = metadata;

        assert.deepEqual(format.container, 'isom/iso2/mp41', 'format.container');
        assert.deepEqual(format.codec, 'MPEG-4/AAC', 'format.codec');
        assert.deepEqual(format.numberOfChannels, 2, 'format.numberOfChannels');
        assert.deepEqual(format.sampleRate, 44100, 'format.sampleRate');
        assert.deepEqual(format.bitsPerSample, 16, 'format.bitsPerSample');

        assert.isDefined(native.iTunes, 'Native m4a tags should be present');
        assert.isAtLeast(native.iTunes.length, 1);

        assert.deepEqual(common.album, 'Live at Tom\'s Bullpen in Dover, DE (2016-04-30)');
        assert.deepEqual(common.albumartist, 'They Say We\'re Sinking');
        assert.deepEqual(common.comment, ['youtube rip\r\nSource: https://www.youtube.com/playlist?list=PLZ4QPxwBgg9TfsFVAArOBfuve_0e7zQaV']);
      });
    });
  });

  /**
   * Ref: https://github.com/Borewit/music-metadata/issues/79
   */
  describe('should be able to extract the composer and artist', () => {

    Parsers.forEach(parser => {
      it(parser.description, async () => {

        const filePath = path.join(mp4Samples, 'issue-79.m4a');

        const metadata = await parser.initParser(filePath, 'audio/mp4');
        const {common, format} = metadata;

        assert.deepEqual(format.container, 'M4A/mp42/isom', 'format.container');
        assert.deepEqual(format.codec, 'MPEG-4/AAC', 'format.codec');
        assert.deepEqual(format.numberOfChannels, 2, 'format.numberOfChannels');
        assert.deepEqual(format.sampleRate, 44100, 'format.sampleRate');
        assert.deepEqual(format.bitsPerSample, 16, 'format.bitsPerSample');

        assert.strictEqual(common.title, 'Uprising');
        assert.deepEqual(common.composer, ['Muse']);
        assert.deepEqual(common.artists, ['Muse']);
        assert.deepEqual(common.genre, ['Rock']);
        assert.strictEqual(common.date, '2009');
        assert.strictEqual(common.encodedby, 'iTunes 8.2.0.23, QuickTime 7.6.2');
        assert.deepEqual(common.disk, {no: 1, of: 1});
        assert.deepEqual(common.track, {no: 1, of: null});
      });
    });
  });

  describe('Parse MPEG-4 Audio Book files (.m4b)', () => {

    describe('audio book from issue issue #127', () => {

      Parsers.forEach(parser => {
        it(parser.description, async () => {

          const filePath = path.join(mp4Samples, 'issue-127.m4b');

          const metadata = await parser.initParser(filePath, 'audio/mp4');
          const {common, format} = metadata;

          assert.deepEqual(format.container, 'M4A/3gp5/isom', 'format.container');
          assert.deepEqual(format.codec, 'MPEG-4/AAC', 'format.codec');

          assert.strictEqual(common.title, 'GloriesIreland00-12_librivox');
          assert.deepEqual(common.artists, ['Joseph Dunn']);
          assert.deepEqual(common.genre, ['Audiobook']);
          assert.strictEqual(common.encodedby, 'Chapter and Verse V 1.5');
          assert.deepEqual(common.disk, {no: null, of: null});
          assert.deepEqual(common.track, {no: 1, of: null});
          assert.deepEqual(common.comment, ['https://archive.org/details/glories_of_ireland_1801_librivox']);

          const iTunes = mm.orderTags(metadata.native.iTunes);
          assert.deepEqual(iTunes.stik, [2], 'iTunes.stik = 2 = Audiobook'); // Ref: http://www.zoyinc.com/?p=1004
        });
      });
    });

    describe('Parse chapters', async () => {

      /**
       * Source audio-book: https://librivox.org/the-babys-songbook-by-walter-crane/
       */
      describe('BabysSongbook_librivox.m4b', async () => {

        function checkMetadata(metadata: mm.IAudioMetadata) {
          const {common, format} = metadata;

          assert.deepEqual(format.container, 'M4A/3gp5/isom', 'format.container');
          assert.deepEqual(format.codec, 'MPEG-4/AAC', 'format.codec');
          assert.approximately(format.duration, 991.213, 1 / 500, 'format.duration');

          assert.strictEqual(common.title, 'Babys Songbook', 'common.title');
          assert.deepEqual(common.artists, ['Walter Crane'], 'common.artists');
          assert.deepEqual(common.genre, ['Audiobook']);
          assert.strictEqual(common.encodedby, 'Chapter and Verse V 1.5');
          assert.deepEqual(common.disk, {no: null, of: null}, 'common.disk');
          assert.deepEqual(common.track, {no: null, of: null}, 'common.track');
          assert.isUndefined(common.comment, 'common.comment');

          const iTunes = mm.orderTags(metadata.native.iTunes);
          assert.deepEqual(iTunes.stik, [2], 'iTunes.stik = 2 = Audiobook'); // Ref: http://www.zoyinc.com/?p=1004

          assert.deepEqual(format.chapters, [
            {
              sampleOffset: 45056,
              timeScale: 44100,
              start: 0,
              title: '01 - Baby\'s Opera: 01 - Girls and Boys'
            },
            {
              sampleOffset: 2695168,
              timeScale: 44100,
              start: 2690214,
              title: '02 - Baby\'s Opera: 02 - The Mulberry Bush'
            },
            {
              sampleOffset: 5083136,
              timeScale: 44100,
              start: 5072343,
              title: '03 - Baby\'s Opera: 03 - Oranges and Lemons'
            },
            {
              sampleOffset: 8352768,
              timeScale: 44100,
              start: 8335466,
              title: '04 - Baby\'s Opera: 04 - St. Paul\'s Steeple'
            },
            {
              sampleOffset: 10544128,
              timeScale: 44100,
              start: 10539994,
              title: '05 - Baby\'s Opera: 05 - My Lady\'s Garden'
            },
            {
              sampleOffset: 12284928,
              timeScale: 44100,
              start: 12260367,
              title: '06 - Baby\'s Opera: 12 - Dickory Dock'
            },
            {
              sampleOffset: 14125056,
              timeScale: 44100,
              start: 14112293,
              title: '07 - Baby\'s Opera: 22 - Baa!Baa!Black Sheep'
            },
            {
              sampleOffset: 16410624,
              timeScale: 44100,
              start: 16405319,
              title: '08 - Baby\'s Bouquet: 01 - Dedication and Polly put the Kettle On'
            },
            {
              sampleOffset: 19068928,
              timeScale: 44100,
              start: 19051667,
              title: '09 - Baby\'s Bouquet: 02 - Hot Cross Buns'
            },
            {
              sampleOffset: 21685248,
              timeScale: 44100,
              start: 21653824,
              title: '10 - Baby\'s Bouquet: 03 - The Little Woman and the Pedlar'
            },
            {
              sampleOffset: 30461952,
              timeScale: 44100,
              start: 30429742,
              title: '11 - Baby\'s Bouquet: 04 - The Little Disaster'
            },
            {
              sampleOffset: 37761024,
              timeScale: 44100,
              start: 37750318,
              title: '12 - Baby\'s Bouquet: 05 - The Old Woman of Norwich'
            },
            {
              sampleOffset: 39628800,
              timeScale: 44100,
              start: 39602731,
              title: '13 - Baby\'s Bouquet: 12 - Lucy Locket'
            },
            {
              sampleOffset: 41500672,
              timeScale: 44100,
              start: 41498151,
              title: '14 - Baby\'s Bouquet: 18 - The North Wind & the Robin'
            }
          ]);
        }

        const filePath = path.join(mp4Samples, 'BabysSongbook_librivox.m4b');

        it('from a file', async () => {

          let metadata: mm.IAudioMetadata;
          const stream = fs.createReadStream(filePath);
          try {
            metadata = await mm.parseStream(stream, {mimeType: 'audio/mp4'}, {includeChapters: true});
          } finally {
            stream.close();
          }
          checkMetadata(metadata);
        });

        it('from a stream', async () => {

          const stream = fs.createReadStream(filePath);
          const metadata = await mm.parseStream(stream, {mimeType: 'audio/mp4'}, {includeChapters: true});
          stream.close();

          checkMetadata(metadata);
        });
      });
    });
  });

  describe('Parse MPEG-4 Video (.mp4)', () => {

    describe('Parse TV episode', () => {

      Parsers.forEach(parser => {
        it(parser.description, async () => {

          const filePath = path.join(mp4Samples, 'Mr. Pickles S02E07 My Dear Boy.mp4');

          const metadata = await parser.initParser(filePath, 'video/mp4');
          assert.deepEqual(metadata.common.title, 'My Dear Boy');
          assert.deepEqual(metadata.common.tvEpisode, 7);
          assert.deepEqual(metadata.common.tvEpisodeId, '017');
          assert.deepEqual(metadata.common.tvSeason, 2);
          assert.deepEqual(metadata.common.tvShow, 'Mr. Pickles');

          assert.deepEqual(metadata.format.container, 'mp42/isom', 'format.container');
          assert.deepEqual(metadata.format.codec, 'MPEG-4/AAC+AC-3+CEA-608', 'format.codec');
          assert.deepEqual(metadata.common.artist, 'Mr. Pickles');
          assert.deepEqual(metadata.common.artists, ['Mr. Pickles']);
          assert.deepEqual(metadata.common.albumartist, 'Mr. Pickles');
          assert.deepEqual(metadata.common.copyright, '© & TM - Cartoon Network - 2016');

          const iTunes = mm.orderTags(metadata.native.iTunes);
          assert.deepEqual(iTunes.stik, [10], 'iTunes.stik = 10 = TV Show'); // Ref: http://www.zoyinc.com/?p=1004
        });
      });
    });
  });

  describe('should support extended atom header', () => {

    Parsers.forEach(parser => {
      it(parser.description, async () => {

        const filePath = path.join(mp4Samples, 'issue-133.m4a');

        const metadata = await parser.initParser(filePath, 'video/mp4');
        assert.deepEqual(metadata.format.container, 'M4A/mp42/isom', 'format.container');
        assert.deepEqual(metadata.format.codec, 'MPEG-4/AAC', 'format.codec');
      });
    });
  });

  describe('Handle dashed atom-ID\'s', () => {

    Parsers.forEach(parser => {
      it(parser.description, async () => {

        const filePath = path.join(mp4Samples, 'issue-151.m4a');

        const metadata = await parser.initParser(filePath, 'video/mp4');
        assert.deepEqual(metadata.format.container, 'mp42/isom', 'format.container');
        assert.deepEqual(metadata.format.codec, 'MPEG-4/AAC+MP4S', 'format.codec');

        assert.deepEqual(metadata.common.album, 'We Don`t Need to Whisper');
        assert.deepEqual(metadata.common.albumartist, 'Angels and Airwaves');
        assert.deepEqual(metadata.common.artist, 'Angels and Airwaves');
        assert.deepEqual(metadata.common.artists, ['Angels and Airwaves']);
        assert.strictEqual(metadata.common.bpm, 89);
        assert.deepEqual(metadata.common.genre, ['Rock']);
        assert.strictEqual(metadata.common.title, 'Distraction');
      });
    });
  });

  /**
   * Related issue: https://github.com/Borewit/music-metadata/issues/318
   */
  it('Be able to handle garbage behind mdat root atom', async () => {

    /**
     * Sample file with 1024 zeroes appended
     */
    const m4aFile = path.join(mp4Samples, 'issue-318.m4a');

    const metadata = await mm.parseFile(m4aFile);
    const {format, common, quality} = metadata;
    assert.strictEqual(format.container, 'M4A/mp42/isom', 'format.container');
    assert.strictEqual(format.codec, 'MPEG-4/AAC', 'format.codec');
    assert.deepEqual(format.numberOfChannels, 2, 'format.numberOfChannels');
    assert.deepEqual(format.sampleRate, 44100, 'format.sampleRate');
    assert.deepEqual(format.bitsPerSample, 16, 'format.bitsPerSample');
    assert.deepEqual(format.tagTypes, ['iTunes'], 'format.tagTypes');

    assert.strictEqual(common.artist, 'Tool', 'common.artist');
    assert.strictEqual(common.title, 'Fear Inoculum', 'common.title');

    assert.includeDeepMembers(quality.warnings, [{message: 'Error at offset=117501: box.id=0'}], 'check for warning regarding box.id=0');
  });

  // https://github.com/Borewit/music-metadata/issues/387
  it('Handle box.id = 0000', async () => {
    const {format, common} = await mm.parseFile(path.join(mp4Samples, 'issue-387.m4a'));
    assert.strictEqual(format.container, 'M4A/mp42/isom', 'format.container');
    assert.strictEqual(format.codec, 'MPEG-4/AAC', 'format.codec');
    assert.approximately(format.duration, 224.00290249433107, 1 / 200, 'format.duration');
    assert.approximately(format.sampleRate, 44100, 1 / 200, 'format.sampleRate');

    assert.strictEqual(common.artist, 'Chris Brown', 'common.artist');
    assert.strictEqual(common.title, 'Look At Me Now', 'common.title');
    assert.strictEqual(common.album, 'Look At Me Now (feat. Lil Wayne & Busta Rhymes) - Single', 'common.album');
  });

  it('Extract creation and modified time', async () => {

    const filePath = path.join(mp4Samples, 'Apple  voice memo.m4a');

    const {format, quality, common, native} = await mm.parseFile(filePath);

    assert.strictEqual(format.container, 'M4A/isom/mp42', 'format.container');
    assert.strictEqual(format.codec, 'MPEG-4/AAC', 'format.codec');
    assert.approximately(format.duration, 1.024, 1 / 2000, 'format.duration');
    assert.strictEqual(format.sampleRate, 48000, 'format.sampleRate');

    assert.strictEqual(format.creationTime.toISOString(), '2021-01-02T17:42:46.000Z', 'format.modificationTime');
    assert.strictEqual(format.modificationTime.toISOString(), '2021-01-02T17:43:25.000Z', 'format.modificationTime');

    const iTunes = mm.orderTags(native.iTunes);
    assert.strictEqual(iTunes.date[0], '2021-01-02T17:42:05Z', 'moov.udta.date');
  });

  // https://github.com/Borewit/music-metadata/issues/744
  it('Select the audio track from mp4', async () => {

    const filePath = path.join(mp4Samples, 'issue-744.mp4');

    const {format} = await mm.parseFile(filePath);

    assert.strictEqual(format.container, 'isom/iso2/mp41', 'format.container');
    assert.strictEqual(format.codec, 'MPEG-4/AAC', 'format.codec');
    assert.strictEqual(format.numberOfChannels, 2, 'format.numberOfChannels');
    assert.strictEqual(format.sampleRate, 44100, 'format.sampleRate');
    assert.strictEqual(format.bitsPerSample, 16, 'format.bitsPerSample');
    assert.approximately(format.duration, 360.8, 1 / 20, 'format.duration');
  });

  // https://github.com/Borewit/music-metadata/issues/749
  it('Handle 0 length box', async () => {

    const filePath = path.join(mp4Samples, 'issue-749.m4a');

    const {format, common} = await mm.parseFile(filePath);

    assert.strictEqual(format.container, 'M4A/mp42/isom', 'format.container');
    assert.strictEqual(format.codec, 'MPEG-4/AAC', 'format.codec');
    assert.strictEqual(format.numberOfChannels, 2, 'format.numberOfChannels');
    assert.strictEqual(format.sampleRate, 48000, 'format.sampleRate');
    assert.strictEqual(format.bitsPerSample, 16, 'format.bitsPerSample');
    assert.approximately(format.duration, 1563.16, 1 / 200, 'format.duration');

    assert.strictEqual('S2E32 : Audio', common.title, 'common.title');
  });

});
