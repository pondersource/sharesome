import EmberObject from '@ember/object';
import Route from '@ember/routing/route';
import { alias } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import { A } from '@ember/array';
import isImageFilename from '../utils/is-image-filename';
import mediaURL from '../utils/media-url';

export default Route.extend({

  router: service(),
  remotestorage: service(),
  rs: alias('remotestorage.rs'),
  rsConnected: alias('remotestorage.connected'),

  beforeModel() {
    if (!this.rsConnected) {
      this.router.transitionTo('index');
    }
  },

  async model() {
    const listing = await this.rs.shares.list();
    const shares = await Promise.all(Object.keys(listing).map(async (filename) => {
      const [url, thumbnailUrl] = await Promise.all([
        this.rs.shares.getFileURL(filename),
        // Dropbox must resolve a real shared link; unlike a remoteStorage URL,
        // a thumbnail URL cannot be constructed for a nonexistent file.
        isImageFilename(filename)
          ? Promise.resolve().then(() => this.rs.shares.getThumbnailURL(filename)).catch(() => null)
          : null
      ]);

      return EmberObject.create({
        name: filename,
        url,
        thumbnailUrl: mediaURL(thumbnailUrl),
        isDeleting: false
      });
    }));

    return A(shares);
  }

});
