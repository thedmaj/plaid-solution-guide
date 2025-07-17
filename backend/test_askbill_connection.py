#!/usr/bin/env python3
"""
AskBill MCP Connection Diagnostic Test

This script tests the AskBill WebSocket connection to diagnose timeout issues.
It performs comprehensive connection testing with detailed logging.
"""

import asyncio
import json
import logging
import time
import sys
import os

# Add the backend directory to the path so we can import bill_client
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from bill_client import AskBillClient, get_askbill_status

# Configure detailed logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('askbill_diagnostic.log')
    ]
)
logger = logging.getLogger("askbill_diagnostic")

async def test_basic_connection():
    """Test basic WebSocket connection without sending messages"""
    logger.info("=== TEST 1: Basic Connection Test ===")
    
    try:
        import websockets
        from websockets.exceptions import ConnectionClosed, WebSocketException, InvalidHandshake, InvalidURI
        
        uri = "wss://hello-finn.herokuapp.com/"
        connection_options = {"origin": "https://plaid.com"}
        
        logger.info(f"Testing connection to: {uri}")
        logger.info(f"Connection options: {connection_options}")
        
        start_time = time.time()
        
        async with websockets.connect(
            uri,
            **connection_options,
            ping_interval=30,
            ping_timeout=15,
            close_timeout=10
        ) as websocket:
            connection_time = time.time() - start_time
            logger.info(f"✅ Connection successful in {connection_time:.2f}s")
            logger.info(f"WebSocket state: {websocket.state}")
            logger.info(f"WebSocket protocol: {websocket.protocol}")
            logger.info(f"WebSocket remote address: {websocket.remote_address}")
            
            # Test ping/pong
            ping_start = time.time()
            pong_waiter = await websocket.ping()
            await pong_waiter
            ping_time = time.time() - ping_start
            logger.info(f"✅ Ping/Pong successful in {ping_time:.3f}s")
            
            return True
            
    except Exception as e:
        logger.error(f"❌ Connection failed: {e}")
        logger.error(f"Error type: {type(e).__name__}")
        return False

async def test_askbill_client_simple():
    """Test AskBillClient with a simple question"""
    logger.info("=== TEST 2: AskBillClient Simple Test ===")
    
    try:
        client = AskBillClient()
        
        # Test with a very simple question
        question = "What is Plaid?"
        logger.info(f"Testing with question: {question}")
        
        start_time = time.time()
        response = await client.ask_question(question, timeout=30.0)
        total_time = time.time() - start_time
        
        logger.info(f"✅ Response received in {total_time:.2f}s")
        logger.info(f"Answer length: {len(response.get('answer', ''))}")
        logger.info(f"Sources count: {len(response.get('sources', []))}")
        
        if response.get('answer'):
            logger.info(f"Answer preview: {response['answer'][:200]}...")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ AskBillClient test failed: {e}")
        logger.error(f"Error type: {type(e).__name__}")
        return False

async def test_askbill_client_timeout():
    """Test AskBillClient with different timeout values"""
    logger.info("=== TEST 3: Timeout Testing ===")
    
    client = AskBillClient()
    question = "Tell me about Plaid's core products and APIs"
    
    timeout_values = [5.0, 10.0, 15.0, 30.0, 60.0]
    
    for timeout in timeout_values:
        logger.info(f"Testing with timeout: {timeout}s")
        
        try:
            start_time = time.time()
            response = await client.ask_question(question, timeout=timeout)
            total_time = time.time() - start_time
            
            if response.get('answer'):
                logger.info(f"✅ Success with {timeout}s timeout in {total_time:.2f}s")
                logger.info(f"Answer length: {len(response['answer'])}")
                return timeout
            else:
                logger.warning(f"⚠️ No answer with {timeout}s timeout")
                
        except asyncio.TimeoutError:
            logger.error(f"❌ Timeout after {timeout}s")
        except Exception as e:
            logger.error(f"❌ Error with {timeout}s timeout: {e}")
    
    return None

async def test_concurrent_requests():
    """Test multiple concurrent requests"""
    logger.info("=== TEST 4: Concurrent Request Test ===")
    
    client = AskBillClient()
    questions = [
        "What is Plaid?",
        "What are Plaid's core products?",
        "How does Plaid authentication work?"
    ]
    
    async def ask_single_question(question, index):
        try:
            logger.info(f"Starting request {index + 1}: {question}")
            start_time = time.time()
            response = await client.ask_question(question, timeout=30.0)
            total_time = time.time() - start_time
            
            if response.get('answer'):
                logger.info(f"✅ Request {index + 1} completed in {total_time:.2f}s")
                return True
            else:
                logger.warning(f"⚠️ Request {index + 1} got no answer")
                return False
                
        except Exception as e:
            logger.error(f"❌ Request {index + 1} failed: {e}")
            return False
    
    try:
        # Run requests concurrently
        tasks = [ask_single_question(q, i) for i, q in enumerate(questions)]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        successful = sum(1 for r in results if r is True)
        logger.info(f"Concurrent test results: {successful}/{len(questions)} successful")
        
        return successful > 0
        
    except Exception as e:
        logger.error(f"❌ Concurrent test failed: {e}")
        return False

async def test_message_processing():
    """Test the message processing flow directly"""
    logger.info("=== TEST 5: Message Processing Test ===")
    
    try:
        import websockets
        import uuid
        
        uri = "wss://hello-finn.herokuapp.com/"
        connection_options = {"origin": "https://plaid.com"}
        
        async with websockets.connect(uri, **connection_options) as websocket:
            # Send a question message
            question_id = uuid.uuid4().hex[:12]
            anonymous_id = str(uuid.uuid4())
            user_id = str(uuid.uuid4())
            
            question_message = {
                "type": "question",
                "anonymous_id": anonymous_id,
                "user_id": user_id,
                "question": "What is Plaid?",
                "question_id": question_id,
                "chat_history": []
            }
            
            logger.info(f"Sending message: {json.dumps(question_message, indent=2)}")
            await websocket.send(json.dumps(question_message))
            
            # Monitor messages
            messages_received = 0
            start_time = time.time()
            
            while messages_received < 20:  # Limit to prevent infinite loop
                try:
                    message = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                    messages_received += 1
                    
                    logger.info(f"Message {messages_received}: {message[:200]}...")
                    
                    try:
                        response = json.loads(message)
                        msg_type = response.get("type", "unknown")
                        
                        if msg_type == "status" and response.get("status") == "finished":
                            logger.info("✅ Received finished status")
                            break
                        elif msg_type == "answer":
                            logger.info(f"Received answer chunk: {len(response.get('answer', ''))} chars")
                        elif msg_type == "sources":
                            logger.info(f"Received sources: {len(response.get('sources', []))} items")
                        
                    except json.JSONDecodeError:
                        logger.warning("Failed to parse JSON message")
                        
                except asyncio.TimeoutError:
                    logger.warning("Timeout waiting for message")
                    break
                except Exception as e:
                    logger.error(f"Error receiving message: {e}")
                    break
            
            total_time = time.time() - start_time
            logger.info(f"Message processing completed in {total_time:.2f}s")
            logger.info(f"Total messages received: {messages_received}")
            
            return messages_received > 0
            
    except Exception as e:
        logger.error(f"❌ Message processing test failed: {e}")
        return False

async def test_network_conditions():
    """Test under different network conditions"""
    logger.info("=== TEST 6: Network Conditions Test ===")
    
    # Test with different connection parameters
    connection_configs = [
        {"ping_interval": 20, "ping_timeout": 10, "close_timeout": 5},
        {"ping_interval": 30, "ping_timeout": 15, "close_timeout": 10},
        {"ping_interval": 60, "ping_timeout": 30, "close_timeout": 20}
    ]
    
    for i, config in enumerate(connection_configs):
        logger.info(f"Testing config {i + 1}: {config}")
        
        try:
            client = AskBillClient()
            # Temporarily modify connection options
            original_options = client.connection_options.copy()
            
            # Test with modified ping settings
            start_time = time.time()
            response = await client.ask_question("What is Plaid?", timeout=30.0)
            total_time = time.time() - start_time
            
            if response.get('answer'):
                logger.info(f"✅ Config {i + 1} successful in {total_time:.2f}s")
            else:
                logger.warning(f"⚠️ Config {i + 1} got no answer")
                
        except Exception as e:
            logger.error(f"❌ Config {i + 1} failed: {e}")

async def run_diagnostic_tests():
    """Run all diagnostic tests"""
    logger.info("🧪 Starting AskBill MCP Connection Diagnostic Tests")
    logger.info("=" * 60)
    
    # Print initial status
    status = get_askbill_status()
    logger.info(f"Initial AskBill status: {status}")
    
    results = {}
    
    # Test 1: Basic connection
    results['basic_connection'] = await test_basic_connection()
    
    # Test 2: Simple AskBillClient
    results['simple_client'] = await test_askbill_client_simple()
    
    # Test 3: Timeout testing
    results['timeout_testing'] = await test_askbill_client_timeout()
    
    # Test 4: Concurrent requests
    results['concurrent_requests'] = await test_concurrent_requests()
    
    # Test 5: Message processing
    results['message_processing'] = await test_message_processing()
    
    # Test 6: Network conditions
    await test_network_conditions()
    
    # Final status
    final_status = get_askbill_status()
    logger.info(f"Final AskBill status: {final_status}")
    
    # Summary
    logger.info("=" * 60)
    logger.info("🧪 DIAGNOSTIC TEST SUMMARY")
    logger.info("=" * 60)
    
    for test_name, result in results.items():
        status_icon = "✅" if result else "❌"
        logger.info(f"{status_icon} {test_name}: {'PASSED' if result else 'FAILED'}")
    
    passed_tests = sum(1 for r in results.values() if r)
    total_tests = len(results)
    
    logger.info(f"Overall result: {passed_tests}/{total_tests} tests passed")
    
    if passed_tests == total_tests:
        logger.info("🎉 All tests passed! AskBill connection is working properly.")
    else:
        logger.error("⚠️ Some tests failed. Check the logs above for details.")
    
    return results

if __name__ == "__main__":
    print("Starting AskBill MCP Connection Diagnostic Tests...")
    print("Check askbill_diagnostic.log for detailed logs")
    
    try:
        results = asyncio.run(run_diagnostic_tests())
        
        if all(results.values()):
            print("\n✅ All diagnostic tests passed!")
            sys.exit(0)
        else:
            print("\n❌ Some diagnostic tests failed. Check the logs for details.")
            sys.exit(1)
            
    except KeyboardInterrupt:
        print("\n⏹️ Tests interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n💥 Diagnostic tests failed with error: {e}")
        sys.exit(1)