"""
AEROTWIN - Aero-Piston Engine Digital Twin & Predictive Health Monitoring System
Demonstrator Entry Point
"""

import uvicorn
import socket
import sys
import webbrowser
import threading
import time

def find_available_port(start_port=8000, max_attempts=10):
    for port in range(start_port, start_port + max_attempts):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind(("127.0.0.1", port))
                return port
            except OSError:
                continue
    return start_port

def open_browser(url):
    time.sleep(1.2)
    try:
        webbrowser.open(url)
    except Exception:
        pass

def main():
    target_port = 8000
    if len(sys.argv) > 1 and sys.argv[1].isdigit():
        target_port = int(sys.argv[1])
    else:
        target_port = find_available_port(8000)

    url = f"http://127.0.0.1:{target_port}"

    print("=" * 70)
    print(" AEROTWIN - Propulsion Digital Twin & Predictive Health Monitoring")
    print(" Target: MALE UAV (Medium Altitude Long Endurance)")
    print(" System: ONLINE | Status: SIMULATION / TEST DATA | Engine: ENG-01")
    print("=" * 70)
    print(f" Starting AEROTWIN unified server at: {url}")
    print(f" API Documentation available at:     {url}/docs")
    print("=" * 70)

    # Automatically launch browser in background
    threading.Thread(target=open_browser, args=(url,), daemon=True).start()

    # Run FastAPI server
    uvicorn.run(
        "backend.main:app",
        host="127.0.0.1",
        port=target_port,
        reload=False,
        log_level="info"
    )

if __name__ == "__main__":
    main()
