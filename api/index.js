// Keep raw IncomingMessage/ServerResponse semantics for the existing MVC backend.
// NODEJS_HELPERS=0 is set on Vercel so body streams are not consumed before validation.
export {handleRequest as default} from '../server/app.js';
