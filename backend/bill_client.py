"""
AskBill client for the backend service.

This module provides a client for interacting with the AskBill websocket service.
"""

import asyncio
import json
import logging
import uuid
from typing import Dict, List, Any, Optional

import websockets
from websockets.exceptions import ConnectionClosed

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("plaid-backend.askbill")

# Response type constants
TYPE_STATUS = "status"
TYPE_SOURCES = "sources"
TYPE_ANSWER = "answer"
STATUS_FINISHED = "finished"

class AskBillClient:
    """Client for interacting with the AskBill websocket service."""
    
    def __init__(self, uri: str = "wss://hello-finn.herokuapp.com/"):
        """
        Initialize the AskBill client.
        
        Args:
            uri: Websocket URI for the service
        """
        self.uri = uri
        self.connection_options = {
            "origin": "https://plaid.com"
        }
        # Generate UUIDs once at initialization
        self.anonymous_id = str(uuid.uuid4())
        self.user_id = str(uuid.uuid4())
        logger.info(f"Initialized AskBill client with anonymous_id={self.anonymous_id[:8]}...")
        
    async def ask_question(self, question: str, timeout: float = 60.0) -> Dict[str, Any]:
        """
        Send a question to the websocket service and return the complete response.

        Args:
            question: The question to ask
            timeout: Maximum time to wait for a response (seconds)

        Returns:
            Dictionary containing the answer and sources
        """
        full_answer: List[str] = []
        sources: List[Dict[str, Any]] = []
        
        logger.info(f"Connecting to AskBill service at {self.uri}")
        try:
            # Add timeout to connection
            async with websockets.connect(
                self.uri, 
                **self.connection_options,
                ping_interval=30,
                ping_timeout=15,
                close_timeout=10
            ) as websocket:
                # Prepare the question message
                question_id = uuid.uuid4().hex[:12]
                question_message = {
                    "type": "question",
                    "anonymous_id": self.anonymous_id,
                    "user_id": self.user_id,
                    "question": question,
                    "question_id": question_id,
                    "chat_history": []
                }

                # Send the question
                logger.info(f"Sending question with ID {question_id}")
                await websocket.send(json.dumps(question_message))

                # Create a task with timeout
                try:
                    return await asyncio.wait_for(self._process_messages(websocket, question_id), timeout)
                except asyncio.TimeoutError:
                    logger.warning(f"Response timed out after {timeout} seconds")
                    return {
                        "answer": f"Response timed out after {timeout} seconds.",
                        "sources": []
                    }
        except ConnectionClosed as e:
            logger.error(f"WebSocket connection closed unexpectedly: {e}")
            return {
                "answer": f"Connection closed: {e}",
                "sources": []
            }
        except Exception as e:
            logger.error(f"Error in AskBill client: {e}", exc_info=True)
            return {
                "answer": f"Error: {e}",
                "sources": []
            }

    async def _process_messages(self, websocket, question_id):
        """Process incoming messages from the websocket."""
        full_answer = []
        sources = []
        
        while True:
            try:
                message = await websocket.recv()
                response = json.loads(message)
                
                # Process response based on type
                if response.get("type") == TYPE_ANSWER:
                    full_answer.append(response.get("answer", ""))
                elif response.get("type") == TYPE_SOURCES:
                    sources.extend(response.get("sources", []))
                elif response.get("type") == TYPE_STATUS and response.get("status") == STATUS_FINISHED:
                    break
                
            except Exception as e:
                logger.error(f"Error processing message: {e}")
                break
        
        return {
            "answer": "".join(full_answer),
            "sources": sources
        }


async def main():
    """Test the AskBill client with a simple question."""
    client = AskBillClient()
    logger.info("Sending test question to AskBill service")
    response = await client.ask_question("what are the core Plaid products?")
    
    logger.info("Received response:")
    logger.info(f"Answer length: {len(response['answer'])}")
    logger.info(f"Sources: {len(response['sources'])}")
    
    if response['sources']:
        for i, source in enumerate(response['sources']):
            logger.info(f"Source {i+1}: {source.get('title', 'Untitled')}")
    
    print("\nAnswer:")
    print(response['answer'])


if __name__ == "__main__":
    asyncio.run(main())
