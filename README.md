# Canary Piet

A lightweight web application for displaying environment and system information. Perfect for testing deployments to Azure Kubernetes Service (AKS), Azure Container Apps (ACA), or local Docker environments.

## Features

- **Environment Information Display**: Shows all environment variables
- **Container Metadata**: Displays hostname, container info, and Kubernetes metadata
- **System Resources**: Real-time CPU, memory, and disk usage
- **Network Information**: IP addresses, interfaces, and network configuration
- **Request Information**: HTTP headers and request details
- **Modern UI**: Built with authentic shadcn/ui components using Tailwind CSS
- **Dark Mode**: Toggle between light and dark themes with smooth transitions
- **Auto-refresh**: Configurable automatic data refresh
- **Health Endpoints**: `/health` and `/ready` endpoints for container orchestration
- **No External Dependencies**: Completely self-contained, no API calls required

## Quick Start

### Run with Docker

```bash
# Build the image
docker build -t cvs79/canarypiet:latest .

# Run locally
docker run -p 8080:8080 cvs79/canarypiet:latest
```

Open http://localhost:8080 in your browser.

### Run with Docker Compose

```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Pull from Docker Hub

```bash
# Pull the pre-built image
docker pull cvs79/canarypiet:latest

# Run it
docker run -p 8080:8080 cvs79/canarypiet:latest
```

## Building and Publishing

### Automated Multi-Architecture Builds (Recommended)

This project uses GitHub Actions to automatically build and publish multi-architecture Docker images (x64 and ARM) to Docker Hub on every push to the main branch.

**Setup Instructions:**

1. **Configure Docker Hub Secrets** in your GitHub repository:
   - Go to: Settings → Secrets and variables → Actions
   - Add the following repository secrets:
     - `DOCKERHUB_TOKEN`: Your Docker Hub access token
       - Create a token at: https://hub.docker.com/settings/security
       - Use an access token (not your password) for better security

2. **Update Version**: Edit `version.txt` in the repository root to set the version number (e.g., `1.0.0`)

3. **Push to Main**: The workflow will automatically:
   - Build images for both `linux/amd64` and `linux/arm64` platforms
   - Tag images as `cvs79/canarypiet:latest` and `cvs79/canarypiet:<version>`
   - Push to Docker Hub
   - Generate a build summary

**Manual Trigger**: You can also trigger builds manually from the Actions tab in GitHub.

### Manual Local Build (Single Architecture)

```bash
# Build for your local architecture
docker build -t cvs79/canarypiet:latest .
```

### Manual Multi-Architecture Build (Advanced)

```bash
# Create a builder instance
docker buildx create --use --name multiarch-builder

# Build and push for multiple architectures
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --tag cvs79/canarypiet:latest \
  --tag cvs79/canarypiet:1.0.0 \
  --push \
  .
```

## Deployment Examples

### Local Docker

```bash
docker run -d \
  --name canarypiet \
  -p 8080:8080 \
  -e ENVIRONMENT=production \
  -e CUSTOM_VAR=my-value \
  cvs79/canarypiet:latest
```

### Kubernetes (AKS)

See `k8s-deployment.yaml` for a complete example.

```bash
# Apply the deployment
kubectl apply -f k8s-deployment.yaml

# Check status
kubectl get pods -l app=canarypiet
kubectl get svc canarypiet

# Get the service URL (for LoadBalancer)
kubectl get svc canarypiet -o jsonpath='{.status.loadBalancer.ingress[0].ip}'

# Port forward for testing
kubectl port-forward svc/canarypiet 8080:80
```

### Azure Container Apps (ACA)

See `aca-deployment.yaml` for a complete example.

```bash
# Create resource group
az group create --name rg-canarypiet --location eastus

# Create container app environment
az containerapp env create \
  --name canarypiet-env \
  --resource-group rg-canarypiet \
  --location eastus

# Deploy the app
az containerapp create \
  --name canarypiet \
  --resource-group rg-canarypiet \
  --environment canarypiet-env \
  --image cvs79/canarypiet:latest \
  --target-port 8080 \
  --ingress external \
  --env-vars ENVIRONMENT=aca DEPLOYMENT_TYPE=azure-container-apps \
  --cpu 0.5 \
  --memory 1.0Gi

# Get the app URL
az containerapp show \
  --name canarypiet \
  --resource-group rg-canarypiet \
  --query properties.configuration.ingress.fqdn \
  --output tsv
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8080` | Port the application listens on |
| `LOG_LEVEL` | `INFO` | Logging level (DEBUG, INFO, WARNING, ERROR) |
| `REFRESH_INTERVAL` | `30` | Auto-refresh interval in seconds (0 to disable) |

### Custom Environment Variables

You can add any custom environment variables and they will be displayed in the dashboard. This is useful for testing configuration in different environments.

## API Endpoints

- `GET /` - Main dashboard (HTML)
- `GET /api/info` - System information (JSON)
- `GET /health` - Health check endpoint
- `GET /ready` - Readiness check endpoint

## Architecture

- **Backend**: Python 3.11 + Flask
- **Frontend**: shadcn/ui components with Tailwind CSS (via CDN)
- **Server**: Gunicorn with 2 workers
- **Base Image**: `python:3.11-slim`
- **Image Size**: ~100MB
- **Security**: Runs as non-root user

## Project Structure

```
canarypiet/
├── app/
│   ├── __init__.py           # App initialization
│   ├── main.py              # Flask routes and app
│   ├── system_info.py       # System info collection
│   └── templates/
│       └── index.html       # Dashboard UI
├── static/
│   └── css/                 # Custom styles (if needed)
├── requirements.txt         # Python dependencies
├── Dockerfile              # Multi-stage Docker build
├── .dockerignore          # Docker ignore patterns
├── docker-compose.yml     # Local development
├── k8s-deployment.yaml    # Kubernetes deployment
├── aca-deployment.yaml    # Azure Container Apps
└── README.md             # This file
```

## Development

### Local Development (without Docker)

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the app
python -m app.main

# Or use Flask directly
export FLASK_APP=app.main
flask run --host=0.0.0.0 --port=8080
```

### Running Tests

```bash
# Test health endpoint
curl http://localhost:8080/health

# Test API endpoint
curl http://localhost:8080/api/info | jq
```

## Use Cases

- **Deployment Testing**: Verify environment variables and configuration
- **Network Diagnostics**: Check container networking and connectivity
- **Resource Monitoring**: View resource allocation in different environments
- **Kubernetes Testing**: Verify pod metadata and service discovery
- **Load Balancer Testing**: Test ingress and service configurations
- **Container Registry Testing**: Quick deployment validation

## Screenshots

The dashboard displays:
- Container hostname and timestamp
- Platform information (OS, Python version, etc.)
- System resources (CPU, memory, disk)
- Network interfaces and IP addresses
- Kubernetes/ACA metadata (when available)
- HTTP request headers
- All environment variables

## License

MIT License - feel free to use this for any purpose.

## Contributing

This is a simple test application. Feel free to fork and modify for your needs.

## Support

For issues or questions, please open an issue on the GitHub repository.
