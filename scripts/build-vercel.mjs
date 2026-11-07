import {mkdir,writeFile} from 'node:fs/promises';
// Public HTML and data scripts must pass through MVC guards, not a static bypass.
// Ship an empty static output and bundle public assets inside the Node Function.
await mkdir(new URL('../dist/',import.meta.url),{recursive:true});
await writeFile(new URL('../dist/.keep',import.meta.url),'');
console.log('Vercel entry: api/index.js; public files served through guarded MVC routes.');
