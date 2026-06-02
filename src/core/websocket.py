import asyncio
import uuid
import time
from typing import List, Dict, Any
from fastapi import WebSocket, WebSocketDisconnect
import ujson

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"WebSocket client connected. Active: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            print(f"WebSocket client disconnected. Active: {len(self.active_connections)}")

    async def send_personal_message(self, message: Dict[str, Any], websocket: WebSocket):
        try:
            await websocket.send_text(ujson.dumps(message))
        except Exception as e:
            print(f"Failed to send message: {e}")

    async def broadcast(self, message: Dict[str, Any]):
        disconnected_sockets = []
        # Add id and timestamp if not present
        if "id" not in message:
            message["id"] = str(uuid.uuid4())
        if "timestamp" not in message:
            message["timestamp"] = int(time.time() * 1000)

        serialized = ujson.dumps(message)
        for connection in self.active_connections:
            try:
                await connection.send_text(serialized)
            except Exception:
                disconnected_sockets.append(connection)
        
        for socket in disconnected_sockets:
            self.disconnect(socket)

    async def start_heartbeat(self):
        """Send a ping heartbeat message every 30 seconds to all clients."""
        while True:
            await asyncio.sleep(30)
            if self.active_connections:
                ping_msg = {
                    "type": "ping",
                    "payload": {},
                    "id": str(uuid.uuid4()),
                    "timestamp": int(time.time() * 1000)
                }
                await self.broadcast(ping_msg)

manager = ConnectionManager()
# Start background heartbeat when server starts
heartbeat_task = None

def get_websocket_manager() -> ConnectionManager:
    return manager
