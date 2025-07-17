"""
AskBill client for the backend service.

This module provides a client for interacting with the AskBill websocket service.
"""

import asyncio
import json
import logging
import time
import uuid
from typing import Dict, List, Any, Optional, Callable

import websockets
from websockets.exceptions import ConnectionClosed, WebSocketException, InvalidHandshake, InvalidURI

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("plaid-backend.askbill")

# Connection status for debug panel
class ConnectionStatus:
    def __init__(self):
        self.connection_attempts = 0
        self.successful_connections = 0
        self.failed_connections = 0
        self.last_connection_time = None
        self.last_error = None
        self.current_status = "disconnected"
        self.response_times = []
        self.total_questions = 0
        self.successful_responses = 0
        
    def to_dict(self):
        return {
            "connection_attempts": self.connection_attempts,
            "successful_connections": self.successful_connections,
            "failed_connections": self.failed_connections,
            "last_connection_time": self.last_connection_time,
            "last_error": str(self.last_error) if self.last_error else None,
            "current_status": self.current_status,
            "avg_response_time": sum(self.response_times) / len(self.response_times) if self.response_times else 0,
            "total_questions": self.total_questions,
            "successful_responses": self.successful_responses,
            "success_rate": (self.successful_responses / self.total_questions * 100) if self.total_questions > 0 else 0
        }

# Global status instance
connection_status = ConnectionStatus()

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
        
        # Store partial responses in case of timeout
        self._partial_answer = []
        self._partial_sources = []
        
        # Enhanced logging with icons
        logger.info(f"🚀 ASKBILL: Initialized AskBill client")
        logger.info(f"🔗 ASKBILL: Target URI: {self.uri}")
        logger.info(f"🆔 ASKBILL: Anonymous ID: {self.anonymous_id[:8]}...")
        logger.info(f"👤 ASKBILL: User ID: {self.user_id[:8]}...")
        
        # Update global status
        global connection_status
        connection_status.current_status = "initialized"
        
    async def ask_question(self, question: str, timeout: float = 60.0) -> Dict[str, Any]:
        """
        Send a question to the websocket service and return the complete response.

        Args:
            question: The question to ask
            timeout: Maximum time to wait for a response (seconds)

        Returns:
            Dictionary containing the answer and sources
        """
        global connection_status
        start_time = time.time()
        question_id = uuid.uuid4().hex[:12]
        
        # Update status tracking
        connection_status.connection_attempts += 1
        connection_status.total_questions += 1
        connection_status.current_status = "connecting"
        
        logger.info(f"📞 ASKBILL: Starting question request")
        logger.info(f"❓ ASKBILL: Question: {question[:100]}{'...' if len(question) > 100 else ''}")
        logger.info(f"🆔 ASKBILL: Question ID: {question_id}")
        logger.info(f"⏰ ASKBILL: Timeout: {timeout}s")
        logger.info(f"🔗 ASKBILL: Connecting to {self.uri}")
        
        try:
            # Connection attempt with detailed logging
            logger.info(f"🔌 ASKBILL: Attempting WebSocket connection...")
            connection_start = time.time()
            
            async with websockets.connect(
                self.uri, 
                **self.connection_options,
                ping_interval=30,
                ping_timeout=15,
                close_timeout=10
            ) as websocket:
                connection_time = time.time() - connection_start
                connection_status.successful_connections += 1
                connection_status.last_connection_time = time.time()
                connection_status.current_status = "connected"
                
                logger.info(f"✅ ASKBILL: Connection established in {connection_time:.2f}s")
                logger.info(f"🔗 ASKBILL: WebSocket state: {websocket.state}")
                
                # Prepare the question message
                question_message = {
                    "type": "question",
                    "anonymous_id": self.anonymous_id,
                    "user_id": self.user_id,
                    "question": question,
                    "question_id": question_id,
                    "chat_history": []
                }

                # Send the question
                logger.info(f"📤 ASKBILL: Sending question message...")
                logger.info(f"📋 ASKBILL: Message size: {len(json.dumps(question_message))} bytes")
                
                send_start = time.time()
                await websocket.send(json.dumps(question_message))
                send_time = time.time() - send_start
                
                logger.info(f"✅ ASKBILL: Question sent in {send_time:.3f}s")
                connection_status.current_status = "waiting_response"

                # Clear partial response storage before starting
                self._partial_answer = []
                self._partial_sources = []
                
                # Create a task with timeout
                try:
                    logger.info(f"⏳ ASKBILL: Waiting for response (timeout: {timeout}s)...")
                    result = await asyncio.wait_for(self._process_messages(websocket, question_id), timeout)
                    
                    # Success metrics
                    total_time = time.time() - start_time
                    connection_status.response_times.append(total_time)
                    connection_status.successful_responses += 1
                    connection_status.current_status = "completed"
                    
                    logger.info(f"🎉 ASKBILL: Question completed successfully in {total_time:.2f}s")
                    logger.info(f"📝 ASKBILL: Answer length: {len(result.get('answer', ''))} chars")
                    logger.info(f"📚 ASKBILL: Sources count: {len(result.get('sources', []))}")
                    
                    return result
                    
                except asyncio.TimeoutError:
                    connection_status.current_status = "timeout"
                    connection_status.last_error = f"Timeout after {timeout}s"
                    
                    # Check if we have partial content to return
                    partial_answer = "".join(self._partial_answer)
                    if partial_answer.strip():
                        logger.warning(f"⏰ ASKBILL: Timed out but returning partial response ({len(partial_answer)} chars)")
                        logger.warning(f"📊 ASKBILL: Connection stats: {connection_status.to_dict()}")
                        
                        return {
                            "answer": partial_answer,
                            "sources": self._partial_sources,
                            "partial_response": True,
                            "timeout_reason": f"Partial response after {timeout}s timeout"
                        }
                    else:
                        logger.error(f"⏰ ASKBILL: Response timed out after {timeout} seconds with no content")
                        logger.error(f"📊 ASKBILL: Connection stats: {connection_status.to_dict()}")
                        
                        return {
                            "answer": f"⏰ AskBill response timed out after {timeout} seconds. Please try again.",
                            "sources": []
                        }
                    
        except ConnectionClosed as e:
            connection_status.failed_connections += 1
            connection_status.current_status = "connection_closed"
            connection_status.last_error = f"Connection closed: {e}"
            
            logger.error(f"🔌 ASKBILL: WebSocket connection closed unexpectedly")
            logger.error(f"❌ ASKBILL: Close code: {e.code if hasattr(e, 'code') else 'unknown'}")
            logger.error(f"💬 ASKBILL: Close reason: {e.reason if hasattr(e, 'reason') else str(e)}")
            
            return {
                "answer": f"🔌 AskBill connection was closed unexpectedly. Please try again.",
                "sources": []
            }
            
        except InvalidHandshake as e:
            connection_status.failed_connections += 1
            connection_status.current_status = "handshake_failed"
            connection_status.last_error = f"Invalid handshake: {e}"
            
            logger.error(f"🤝 ASKBILL: WebSocket handshake failed")
            logger.error(f"❌ ASKBILL: Handshake error: {e}")
            logger.error(f"🔗 ASKBILL: Check if the server URL is correct: {self.uri}")
            
            return {
                "answer": f"🤝 Failed to establish connection to AskBill (handshake failed). Please check your network connection.",
                "sources": []
            }
            
        except InvalidURI as e:
            connection_status.failed_connections += 1
            connection_status.current_status = "invalid_uri"
            connection_status.last_error = f"Invalid URI: {e}"
            
            logger.error(f"🔗 ASKBILL: Invalid WebSocket URI")
            logger.error(f"❌ ASKBILL: URI error: {e}")
            logger.error(f"🔗 ASKBILL: Provided URI: {self.uri}")
            
            return {
                "answer": f"🔗 Invalid AskBill server configuration. Please contact support.",
                "sources": []
            }
            
        except WebSocketException as e:
            connection_status.failed_connections += 1
            connection_status.current_status = "websocket_error"
            connection_status.last_error = f"WebSocket error: {e}"
            
            logger.error(f"🌐 ASKBILL: WebSocket protocol error")
            logger.error(f"❌ ASKBILL: WebSocket error: {e}")
            
            return {
                "answer": f"🌐 WebSocket communication error with AskBill. Please try again.",
                "sources": []
            }
            
        except Exception as e:
            connection_status.failed_connections += 1
            connection_status.current_status = "unknown_error"
            connection_status.last_error = f"Unknown error: {e}"
            
            logger.error(f"💥 ASKBILL: Unexpected error occurred")
            logger.error(f"❌ ASKBILL: Error type: {type(e).__name__}")
            logger.error(f"💬 ASKBILL: Error message: {e}")
            logger.error(f"📊 ASKBILL: Connection stats: {connection_status.to_dict()}")
            logger.error(f"🔍 ASKBILL: Full traceback:", exc_info=True)
            
            return {
                "answer": f"💥 Unexpected error connecting to AskBill: {e}",
                "sources": []
            }

    async def _process_messages(self, websocket, question_id):
        """Process incoming messages from the websocket."""
        full_answer = []
        sources = []
        messages_received = 0
        answer_chunks = 0
        
        logger.info(f"📥 ASKBILL: Starting message processing for question {question_id}")
        
        while True:
            try:
                logger.info(f"⏳ ASKBILL: Waiting for next message...")
                message = await websocket.recv()
                messages_received += 1
                
                logger.info(f"📨 ASKBILL: Received message #{messages_received} ({len(message)} bytes)")
                
                try:
                    response = json.loads(message)
                    msg_type = response.get("type", "unknown")
                    
                    logger.info(f"📋 ASKBILL: Message type: {msg_type}")
                    
                    # Process response based on type
                    if response.get("type") == TYPE_ANSWER:
                        answer_chunk = response.get("ans", "")  # Fixed: use "ans" key not "answer"
                        full_answer.append(answer_chunk)
                        answer_chunks += 1
                        
                        # Store in instance variables for timeout handling
                        self._partial_answer.append(answer_chunk)
                        
                        logger.info(f"💬 ASKBILL: Answer chunk #{answer_chunks} ({len(answer_chunk)} chars)")
                        logger.info(f"📝 ASKBILL: Total answer length: {len(''.join(full_answer))} chars")
                        
                    elif response.get("type") == TYPE_SOURCES:
                        new_sources = response.get("sources", [])
                        sources.extend(new_sources)
                        
                        # Store in instance variables for timeout handling
                        self._partial_sources.extend(new_sources)
                        
                        logger.info(f"📚 ASKBILL: Received {len(new_sources)} sources")
                        logger.info(f"📚 ASKBILL: Total sources: {len(sources)}")
                        
                        # Log source titles for debugging
                        for i, source in enumerate(new_sources):
                            title = source.get("title", "Untitled")
                            url = source.get("url", "No URL")
                            logger.info(f"📖 ASKBILL: Source {len(sources)-len(new_sources)+i+1}: {title[:50]}...")
                            
                    elif response.get("type") == TYPE_STATUS:
                        status = response.get("status", "unknown")
                        logger.info(f"📊 ASKBILL: Status update: {status}")
                        
                        if status == STATUS_FINISHED:
                            logger.info(f"🏁 ASKBILL: Response finished!")
                            logger.info(f"📊 ASKBILL: Final stats - Messages: {messages_received}, Answer chunks: {answer_chunks}, Sources: {len(sources)}")
                            break
                    else:
                        logger.info(f"❓ ASKBILL: Unknown message type: {msg_type}")
                        logger.info(f"🔍 ASKBILL: Message content: {str(response)[:200]}...")
                        
                except json.JSONDecodeError as e:
                    logger.error(f"🔍 ASKBILL: Failed to parse JSON response")
                    logger.error(f"❌ ASKBILL: JSON error: {e}")
                    logger.error(f"📄 ASKBILL: Raw message: {message[:500]}...")
                    break
                    
            except ConnectionClosed as e:
                logger.error(f"🔌 ASKBILL: WebSocket closed during message processing")
                logger.error(f"❌ ASKBILL: Close code: {e.code if hasattr(e, 'code') else 'unknown'}")
                logger.error(f"💬 ASKBILL: Close reason: {e.reason if hasattr(e, 'reason') else str(e)}")
                break
                
            except Exception as e:
                logger.error(f"💥 ASKBILL: Error processing message #{messages_received}")
                logger.error(f"❌ ASKBILL: Error type: {type(e).__name__}")
                logger.error(f"💬 ASKBILL: Error message: {e}")
                logger.error(f"🔍 ASKBILL: Full traceback:", exc_info=True)
                break
        
        final_answer = "".join(full_answer)
        logger.info(f"✅ ASKBILL: Message processing complete")
        logger.info(f"📝 ASKBILL: Final answer length: {len(final_answer)} characters")
        logger.info(f"📚 ASKBILL: Final sources count: {len(sources)}")
        
        # Log the complete AskBill response for comparison with Anthropic
        logger.info(f"🔍 ASKBILL: COMPLETE RESPONSE START:")
        logger.info(f"=== ASKBILL FULL ANSWER ===")
        logger.info(final_answer)
        logger.info(f"=== ASKBILL SOURCES ===")
        for i, source in enumerate(sources):
            logger.info(f"Source {i+1}: {source.get('title', 'No title')} - {source.get('url', 'No URL')}")
        logger.info(f"🔍 ASKBILL: COMPLETE RESPONSE END")
        
        return {
            "answer": final_answer,
            "sources": sources
        }

    def get_connection_status(self) -> Dict[str, Any]:
        """Get current connection status for debugging."""
        global connection_status
        return connection_status.to_dict()

def get_askbill_status() -> Dict[str, Any]:
    """Global function to get AskBill connection status."""
    global connection_status
    return connection_status.to_dict()


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
