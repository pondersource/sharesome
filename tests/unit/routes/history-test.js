import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import Service from '@ember/service';

module('Unit | Route | history', function(hooks) {
  setupTest(hooks);

  test('resolves asynchronous file and thumbnail URLs before rendering history', async function(assert) {
    this.owner.register('service:remotestorage', class extends Service {
      rs = {
        shares: {
          list: async () => ({ '261102-1500-photo.png': {}, '261102-1501-note.txt': {} }),
          getFileURL: async (name) => `https://storage.example/public/shares/${name}`,
          getThumbnailURL: async (name) => `https://storage.example/public/shares/thumbnails/${name}.png`
        }
      };
    });

    const items = await this.owner.lookup('route:history').model();
    assert.strictEqual(items.length, 2);
    assert.strictEqual(items[0].url, 'https://storage.example/public/shares/261102-1500-photo.png');
    assert.strictEqual(items[0].thumbnailUrl, 'https://storage.example/public/shares/thumbnails/261102-1500-photo.png.png');
    assert.strictEqual(items[1].url, 'https://storage.example/public/shares/261102-1501-note.txt');
    assert.strictEqual(items[1].isDeleting, false);
  });
});
