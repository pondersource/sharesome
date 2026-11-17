# Sharesome

Sharesome lets you share files quickly from your own remote storage account.

Your account needs to support the RS (remoteStorage) standard. See
https://remotestorage.io for more information.

## Contributing

Please open GitHub issues for any questions, feedback or feature requests. Pull
requests for the source code are very welcome and will always be responded to.

## Prerequisites

You will need the following things properly installed on your computer.

* [Git](https://git-scm.com/)
* [Node.js](https://nodejs.org/) (with npm)
* [Ember CLI](https://ember-cli.com/)
* [Google Chrome](https://google.com/chrome/)

## Installation

* `git clone git@github.com:skddc/sharesome.git` this repository
* `cd sharesome`
* `npm install`

## Running / Development

* `npm start`
* Visit the app at [http://localhost:4200](http://localhost:4200).
* Visit the tests at [http://localhost:4200/tests](http://localhost:4200/tests).

### Code Generators

Make use of the many generators for code, try `ember help generate` for more details

### Running Tests

* `npm test` for one-off runs
* `ember test --server` to watch files and run tests automatically

### Linting

* `npm run lint:hbs`
* `npm run lint:js`
* `npm run lint:js -- --fix`

### Building

* `npm run build` (development)
* `npm run build:prod` (production)

### Deploying

For deploying a new version to https://sharesome.5apps.com you need to be added
as a collaborator on [5apps Deploy](https://5apps.com/deploy/).

* `npm run deploy` (production)

## Further Reading / Useful Links

* [ember.js](https://emberjs.com/)
* [ember-cli](https://ember-cli.com/)
* Development Browser Extensions
  * [ember inspector for chrome](https://chrome.google.com/webstore/detail/ember-inspector/bmdblncegkenkacieihfhpjfppoconhi)
  * [ember inspector for firefox](https://addons.mozilla.org/en-US/firefox/addon/ember-inspector/)


## PonderSource storage providers

Public OAuth application identifiers are configured in `app/config/storage-providers.js`. These are
client IDs/app keys, never client secrets. The shared PonderSource Dropbox
registration uses an app folder so these apps can share their remoteStorage data.
Google Drive is not offered here because rs.js cannot create public sharing links for it.

Register `https://sharesome.pondersource.com/connect` as the OAuth callback.
Nested routes return to this stable app route before starting provider sign-in.

The PonderSource Google OAuth project is `pondersource-apps`. It is in
production mode, available beyond named test users. Google verification is still
pending; users may see an unverified-app warning and the project has a lifetime
100-user cap until its requested scopes are approved. The published privacy
notice is https://pondersource.com/privacy.html.
The Dropbox app is **PonderSource Apps** (app key `gaezgoax9khjilj`), with
additional users enabled in development mode (up to 500 users).
