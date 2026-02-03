import os
import asyncio
import subprocess
import signal
import sys
import httpx
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Response, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse
from starlette.background import BackgroundTask
import websockets

VITE_PORT = 5173
API_PORT = 5000

vite_process = None

async def start_vite():
    global vite_process
    vite_process = subprocess.Popen(
        ["npx", "vite", "--port", str(VITE_PORT)],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        cwd=os.getcwd()
    )
    await asyncio.sleep(3)

def stop_vite():
    global vite_process
    if vite_process:
        vite_process.terminate()
        vite_process.wait()

@asynccontextmanager
async def lifespan(app: FastAPI):
    await start_vite()
    yield
    stop_vite()

from backend.main import app as api_app

proxy_app = FastAPI(lifespan=lifespan)

for route in api_app.routes:
    proxy_app.routes.append(route)

for middleware in api_app.user_middleware:
    proxy_app.add_middleware(middleware.cls, **middleware.kwargs)

@proxy_app.websocket("/{path:path}")
async def websocket_proxy(websocket: WebSocket, path: str):
    await websocket.accept()
    try:
        async with websockets.connect(f"ws://127.0.0.1:{VITE_PORT}/{path}") as ws:
            async def forward_to_client():
                try:
                    async for message in ws:
                        if isinstance(message, str):
                            await websocket.send_text(message)
                        else:
                            await websocket.send_bytes(message)
                except:
                    pass
            
            async def forward_to_server():
                try:
                    while True:
                        data = await websocket.receive()
                        if "text" in data:
                            await ws.send(data["text"])
                        elif "bytes" in data:
                            await ws.send(data["bytes"])
                except:
                    pass
            
            await asyncio.gather(forward_to_client(), forward_to_server())
    except Exception as e:
        pass
    finally:
        try:
            await websocket.close()
        except:
            pass

@proxy_app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"])
async def proxy_to_vite(request: Request, path: str):
    if path.startswith("api/"):
        return Response(status_code=404, content="API route not found")
    
    async with httpx.AsyncClient() as client:
        url = f"http://127.0.0.1:{VITE_PORT}/{path}"
        
        headers = dict(request.headers)
        headers.pop("host", None)
        
        try:
            body = await request.body()
            response = await client.request(
                method=request.method,
                url=url,
                headers=headers,
                content=body,
                params=request.query_params,
                follow_redirects=True
            )
            
            excluded_headers = {"content-encoding", "content-length", "transfer-encoding", "connection"}
            response_headers = {
                k: v for k, v in response.headers.items()
                if k.lower() not in excluded_headers
            }
            
            return Response(
                content=response.content,
                status_code=response.status_code,
                headers=response_headers
            )
        except httpx.ConnectError:
            return Response(status_code=503, content="Vite dev server not ready")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(proxy_app, host="0.0.0.0", port=API_PORT)
