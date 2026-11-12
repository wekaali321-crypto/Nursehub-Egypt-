import { handleStorage } from '../../_lib/sbstorage.js';
export const onRequest = ({ request, env, params }) => handleStorage(request, env, [].concat(params.path || []));
