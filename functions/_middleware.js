// Branch previews must use their own assets and links instead of the canonical
// production origin embedded by Publii. Production responses pass through.
export async function onRequest({request,next}) {
 const response=await next();
 if(!new URL(request.url).hostname.endsWith('.sync-pundit-blog.pages.dev')||!response.headers.get('content-type')?.includes('text/html'))return response;
 const rewrite={element(element){
  for(const name of ['href','src','srcset']){
   const value=element.getAttribute(name);
   if(value)element.setAttribute(name,value.replaceAll('https://blog.syncpundit.io/','/').replaceAll('https://blog.syncpundit.com/','/'));
  }
 }};
 return new HTMLRewriter().on('a[href]',rewrite).on('link[rel="stylesheet"]',rewrite).on('script[src]',rewrite).on('img',rewrite).transform(response);
}
