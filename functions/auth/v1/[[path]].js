import { handleAuth } from '../../_lib/sbauth.js';
export const onRequest = ({ request, env, params }) => handleAuth(request, env, [].concat(params.path || []));
