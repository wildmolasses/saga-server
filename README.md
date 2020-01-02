# saga-server

This server will serve as a basic tool for allowing users to `saga pull` and `saga push`, which will make it possible for them to collaborate across the internets.

## Directions

First, install the server code:

```
npm install;
```

Then, make sure mongoDB is installed on your computer. After mongo is installed and running (command mongod), run the following code in a terminal:

```
mongo;
use saga-server;
quit();
```

This will create a mongo table for the saga-server. Finially, you can start the app with:
```
npm run devStart;
```

Navigate to ```http://localhost:3000/``` to use website
