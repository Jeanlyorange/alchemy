// copy the migration.json file from the subgraph repo to local config directory

const path = require('path');
const fs = require('fs-promise')
const subgraphRepo = path.resolve('./node_modules/@daostack/subgraph');

const destDir = path.resolve('./config')

fs.copyFile(`${subgraphRepo}/migration.json`, `${destDir}/migration.json`, (err) => {
  if (err) throw err
  console.log(`copied migration file to ${destDir}/migration.json`)
})
