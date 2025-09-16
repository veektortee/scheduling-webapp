# FastAPI Solver Service Setup Guide

## Overview

Your medical staff scheduling application now uses a high-performance **FastAPI** local solver service for compute-intensive optimization tasks. This hybrid architecture provides:

- **Vercel-hosted Next.js frontend** for the UI
- **Local FastAPI service** for OR-Tools optimization
- **Real-time communication** via WebSocket + REST API
- **Optimal performance** for large scheduling problems

## Architecture Benefits

### Why FastAPI over Flask/Django?

1. **⚡ Performance**: 2-3x faster than Flask
2. **🔄 Async Support**: Better for long-running optimizations  
3. **📡 WebSocket Built-in**: Real-time progress updates
4. **🔧 Modern APIs**: Auto-generated docs, type validation
5. **🚀 Production Ready**: High concurrency support

### Why Local Service?

- **⏱️ Vercel Limitations**: 10-second timeout for serverless functions
- **🔢 Large Problems**: Your OR-Tools optimization can take minutes
- **💾 Memory**: Local service can use full system resources
- **📊 Complex Output**: Generate Excel files, detailed logs

## Quick Start

### 1. Install Dependencies

```powershell
# Navigate to your project directory
cd c:\Werk\Webapp\Webapp7aramoy\scheduling-webapp

# Install Python dependencies
pip install -r requirements.txt

# Or install individually:
pip install fastapi uvicorn websockets python-multipart ortools openpyxl
```

### 2. Start the Solver Service

```powershell
# Start FastAPI solver service
python fastapi_solver_service.py
```

You should see:
```
🚀 Starting Medical Staff Scheduling Solver Service (FastAPI)
📊 Service URL: http://localhost:8000
📚 API Documentation: http://localhost:8000/docs
```

### 3. Start Your Web Application

```powershell
# In a new terminal window
npm run dev
```

### 4. Test the Integration

1. Open http://localhost:3000
2. Login with your credentials
3. Go to the **Run** tab
4. Click **"Run Solver"**
5. Watch real-time progress updates!

## Service Features

### FastAPI Service (`fastapi_solver_service.py`)

#### Endpoints:
- `POST /solve` - Submit optimization case
- `GET /status/{run_id}` - Check optimization status  
- `GET /runs` - List all optimization runs
- `WebSocket /ws/{run_id}` - Real-time progress updates
- `GET /output/{run_id}` - List output files
- `GET /download/{run_id}/{filename}` - Download results
- `GET /health` - Service health check
- `GET /docs` - Interactive API documentation

#### Real-time Features:
- **WebSocket Progress**: Live updates during optimization
- **Background Processing**: Non-blocking optimization runs
- **Status Polling**: Fallback for WebSocket failures
- **Multi-Solution Support**: Generate K diverse solutions
- **Comprehensive Logging**: Detailed progress tracking

### Web Application Integration

#### Enhanced RunTab Component:
- **Real-time Progress Bar**: Shows optimization progress
- **Live Logs**: Timestamped status messages
- **WebSocket Connection**: Automatic real-time updates  
- **Stop Button**: Cancel running optimizations
- **Clear Logs**: Reset log display
- **Error Handling**: Detailed error messages with solutions

#### API Route (`/api/solve`):
- **Service Detection**: Auto-detect local FastAPI service
- **Error Handling**: Comprehensive error types and solutions
- **Status Polling**: Proxy status checks to FastAPI service
- **Timeout Management**: Proper timeout handling

## Configuration

### Environment Variables

Create `.env.local` in your Next.js project:

```env
# Solver service URL (default: http://localhost:8000)  
SOLVER_SERVICE_URL=http://localhost:8000

# Service timeout (default: 30 seconds)
SOLVER_TIMEOUT=30000
```

### Solver Configuration

The FastAPI service integrates your existing solver configuration from the `constants` section of your test cases:

```json
{
  "constants": {
    "solver": {
      "max_time_in_seconds": 300,
      "num_threads": 8,
      "relative_gap": 0.01
    },
    "weights": {
      "hard": { ... },
      "soft": { ... }
    }
  }
}
```

## Troubleshooting

### Common Issues

#### ❌ "Cannot connect to solver service"

**Solutions:**
1. Start the FastAPI service: `python fastapi_solver_service.py`
2. Check service health: http://localhost:8000/health
3. Verify firewall/antivirus isn't blocking port 8000

#### ❌ "Service timeout"

**Solutions:**
1. Increase timeout in `.env.local`: `SOLVER_TIMEOUT=60000`
2. Check system resources (CPU/memory)
3. Restart both services

#### ❌ "WebSocket connection failed"

**Solutions:**
1. Service will automatically fallback to polling
2. Check browser console for WebSocket errors
3. Ensure port 8000 is accessible

#### ❌ "Import errors" (OR-Tools, FastAPI)

**Solutions:**
1. Reinstall dependencies: `pip install -r requirements.txt`
2. Check Python version (3.8+ recommended)  
3. Use virtual environment: `python -m venv venv`

### Performance Optimization

#### For Large Problems (1000+ shifts):
1. **Increase timeout**: `max_time_in_seconds: 900` (15 minutes)
2. **Use more threads**: `num_threads: 16` (match your CPU cores)
3. **Monitor memory**: Task Manager → Performance
4. **Close other applications**: Free up system resources

#### WebSocket Performance:
- WebSocket updates every 1-2 seconds during optimization
- Automatically falls back to polling if WebSocket fails
- Progress updates don't affect solver performance

## Development

### Adding New Features

#### Custom Constraints:
1. Edit `_build_and_solve_model()` in `fastapi_solver_service.py`
2. Add constraint logic using OR-Tools CP-SAT
3. Test with small cases first

#### Output Formats:
1. Extend `_generate_excel_outputs()` for custom Excel formats
2. Add new endpoints for different output types
3. Update UI to handle new formats

#### Real-time Updates:
1. Add new message types in WebSocket handler  
2. Update React component to handle new message types
3. Test WebSocket connection handling

### Production Deployment

#### For Production Use:
1. **Security**: Add authentication to FastAPI service
2. **Logging**: Configure proper logging levels
3. **Monitoring**: Add health checks and metrics
4. **Scaling**: Use multiple FastAPI instances behind load balancer

#### Docker Deployment:
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "fastapi_solver_service:app", "--host", "0.0.0.0", "--port", "8000"]
```

## API Documentation

### Interactive Documentation

Visit http://localhost:8000/docs when the service is running for:
- **Complete API reference**
- **Interactive testing interface** 
- **Request/response examples**
- **WebSocket testing tools**

### Example API Usage

#### Submit Optimization:
```javascript
const response = await fetch('http://localhost:8000/solve', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(schedulingCase)
});
const { run_id } = await response.json();
```

#### Check Status:
```javascript
const status = await fetch(`http://localhost:8000/status/${run_id}`);
const { progress, status: state } = await status.json();
```

#### WebSocket Updates:
```javascript
const ws = new WebSocket(`ws://localhost:8000/ws/${run_id}`);
ws.onmessage = (event) => {
  const { progress, message } = JSON.parse(event.data);
  // Update UI with real-time progress
};
```

## Next Steps

1. **Test the setup** with your existing scheduling cases
2. **Monitor performance** for your typical problem sizes  
3. **Customize constraints** for your specific hospital requirements
4. **Add custom output formats** if needed
5. **Consider production deployment** options

## Support

- **Service Health**: http://localhost:8000/health
- **API Docs**: http://localhost:8000/docs  
- **Logs**: Check console output from `fastapi_solver_service.py`
- **Browser Console**: Check for WebSocket/API errors

Your scheduling application is now ready for high-performance optimization with real-time progress updates! 🚀