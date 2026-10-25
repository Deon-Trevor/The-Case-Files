"""Preview exported Publii pages with same-origin development resources."""
import argparse
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(ROOT),**kwargs)
 def do_GET(self):
  path=Path(self.translate_path(self.path))
  if path.is_dir():path=path/'index.html'
  if path.is_file() and path.suffix=='.html':
   html=path.read_text()
   # Keep canonical/metadata meaningful; point navigable local preview resources
   # at this server so the browser exercises the edited assets and posts.
   html=html.replace('https://blog.syncpundit.io/','/').replace('https://blog.syncpundit.com/','/')
   body=html.encode();self.send_response(200);self.send_header('Content-Type','text/html; charset=utf-8');self.send_header('Content-Length',str(len(body)));self.end_headers();self.wfile.write(body)
  else:super().do_GET()
 def log_message(self,*args):pass
if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--port',type=int,default=8793);args=parser.parse_args()
 print(f'Case Files preview: http://127.0.0.1:{args.port}',flush=True)
 ThreadingHTTPServer(('127.0.0.1',args.port),Handler).serve_forever()
