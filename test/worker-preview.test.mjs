import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/worker.js';
import {onRequest} from '../functions/_middleware.js';

test('preview host rewrites blog assets while production keeps canonical links', async () => {
 const original=globalThis.HTMLRewriter;
 let rewrite;
 globalThis.HTMLRewriter=class {
  on(selector,handler) {if(selector==='a[href]')rewrite=handler;return this;}
  transform(response) {
   const attributes=new Map([['href','https://blog.syncpundit.io/article/']]);
   rewrite.element({getAttribute:name=>attributes.get(name),setAttribute:(name,value)=>attributes.set(name,value)});
   return new Response(attributes.get('href'),{headers:response.headers});
  }
 };
 try {
  const env={ASSETS:{fetch:()=>new Response('asset',{headers:{'content-type':'text/html'}})}};
  const preview=await worker.fetch(new Request('https://sync-pundit-blog-worker-preview.account.workers.dev/'),env);
  assert.equal(await preview.text(),'/article/');
  const production=await worker.fetch(new Request('https://blog.syncpundit.io/'),env);
  assert.equal(await production.text(),'asset');
  const pages=await onRequest({request:new Request('https://branch.sync-pundit-blog.pages.dev/'),next:env.ASSETS.fetch});
  assert.equal(await pages.text(),'/article/');
 } finally {globalThis.HTMLRewriter=original;}
});
