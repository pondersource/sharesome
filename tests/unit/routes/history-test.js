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
          getThumbnailURL: async (name) => {
            assert.true(name.endsWith('.png'), 'non-image files never request thumbnails');
            return `https://storage.example/public/shares/thumbnails/${name}.png`;
          }
        }
      };
    });

    const items = await this.owner.lookup('route:history').model();
    assert.strictEqual(items.length, 2);
    assert.strictEqual(items[0].url, 'https://storage.example/public/shares/261102-1500-photo.png');
    assert.strictEqual(items[0].thumbnailUrl, 'https://storage.example/public/shares/thumbnails/261102-1500-photo.png.png');
    assert.strictEqual(items[1].url, 'https://storage.example/public/shares/261102-1501-note.txt');
    assert.strictEqual(items[1].isDeleting, false);
    assert.strictEqual(items[1].thumbnailUrl, null);
  });
  test('a missing image thumbnail does not discard the history', async function(assert) {
    this.owner.register('service:remotestorage', class extends Service {
      rs = { shares: {
        list: async () => ({ 'photo.PNG': {}, 'note.txt': {} }),
        getFileURL: async name => `https://www.dropbox.com/s/example/${name}?dl=0`,
        getThumbnailURL: async () => { throw new Error('path/not_found'); }
      } };
    });
    const items = await this.owner.lookup('route:history').model();
    assert.strictEqual(items.length, 2);
    assert.strictEqual(items[0].thumbnailUrl, null);
    assert.ok(items[0].url.includes('photo.PNG'));
  });
});
