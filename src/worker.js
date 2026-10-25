import {rewritePreviewResponse} from '../functions/_middleware.js';

export default {
 async fetch(request,env) {
  const response=await env.ASSETS.fetch(request);
  const preview=new URL(request.url).hostname.endsWith('.workers.dev');
  return rewritePreviewResponse(response,preview);
 }
};
