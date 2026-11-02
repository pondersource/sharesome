import EmberObject from '@ember/object';
import Route from '@ember/routing/route';
import { alias } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import { A } from '@ember/array';

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
        this.rs.shares.getThumbnailURL(filename)
      ]);

      return EmberObject.create({
        name: filename,
        url,
        thumbnailUrl,
        isDeleting: false
      });
    }));

    return A(shares);
  }

});
