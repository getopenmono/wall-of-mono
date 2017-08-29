# Development

You can start the server by

    $ npm run serve

which will autoreload when the source changes.

## Directory structure

The `postinstall` part of `package.json` makes sure that there are symbolic links in `node_modules` such that you can get the server configuration from anywhere by simply:

    const config = require('server/config')

and you can use a custom library in `lib` from anywhere thus:

    const jsonTricks = require('__/json-tricks')

## Caveats

 - After installing new NPM packages, you might have to `npm run postinstall` manually to get the links set up correctly.
