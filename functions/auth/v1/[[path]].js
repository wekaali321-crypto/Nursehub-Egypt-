import { handleAuth } from '../../_lib/sbauth.js';
export const onRequest = (context) => handleAuth(context.request, context.env, [].concat(context.params.path || []), { waitUntil: (p) => context.waitUntil(p) });
