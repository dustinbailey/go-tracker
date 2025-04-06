const fs = require('fs');
const packageJson = require('./package.json');
const packageLock = require('./package-lock.json');

// Update the dependencies in package-lock.json
packageLock.packages[''].dependencies['csv-parse'] = packageJson.dependencies['csv-parse'];
packageLock.packages[''].dependencies['dotenv'] = packageJson.dependencies['dotenv'];

// Write the updated package-lock.json
fs.writeFileSync('./package-lock.json', JSON.stringify(packageLock, null, 2));
console.log('package-lock.json has been updated.'); 