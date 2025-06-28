import uvicorn
from app import app
from config import SERVER_HOST, SERVER_PORT, DEBUG_MODE

def main() -> None:
    """Main function to run the API server."""
    print("🚀 Starting Website Contact Parser API...")
    print(f"📖 API Documentation: http://{SERVER_HOST}:{SERVER_PORT}/docs")
    print("⏹️  Press Ctrl+C to stop the server")
    print("-" * 50)
    
    uvicorn.run(
        "app:app", 
        host=SERVER_HOST, 
        port=SERVER_PORT, 
        reload=DEBUG_MODE,
        log_level="info"
    )

if __name__ == '__main__':
    main()