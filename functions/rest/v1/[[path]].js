import { handleRest } from '../../_lib/sb.js';
export const onRequest = ({ request, env, params }) => handleRest(request, env, [].concat(params.path || []));
