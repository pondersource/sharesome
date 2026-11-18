import { module, test } from 'qunit';
import mediaURL from 'sharesome/utils/media-url';
import isImageFilename from 'sharesome/utils/is-image-filename';

module('Unit | Utility | media URL', function() {
  test('Dropbox images render directly while retaining their link key', function(assert) {
    assert.equal(mediaURL('https://www.dropbox.com/scl/fi/example/photo.png?rlkey=key&dl=0'),
      'https://www.dropbox.com/scl/fi/example/photo.png?rlkey=key&raw=1');
    assert.true(isImageFilename('photo.PNG'));
    assert.false(isImageFilename('notes.txt'));
  });
  test('ordinary storage URLs and absent thumbnails are unchanged', function(assert) {
    assert.equal(mediaURL('https://storage.example/image.png'), 'https://storage.example/image.png');
    assert.strictEqual(mediaURL(null), null);
  });
});
