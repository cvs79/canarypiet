# Multi-stage build for optimized image size
FROM python:3.13-alpine3.22 AS builder

# Set working directory
WORKDIR /app

# Install build dependencies required for psutil
RUN apk add --no-cache gcc musl-dev linux-headers python3-dev

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Final stage
FROM python:3.13-alpine3.22

# Set working directory
WORKDIR /app

# Create non-root user first
RUN adduser -D -u 1000 appuser

# Copy Python dependencies from builder to appuser's home
COPY --from=builder /root/.local /home/appuser/.local

# Copy application code
COPY app/ ./app/
COPY static/ ./static/

# Fix ownership
RUN chown -R appuser:appuser /app /home/appuser/.local

# Switch to non-root user
USER appuser

# Make sure scripts in .local are usable
ENV PATH=/home/appuser/.local/bin:$PATH

# Set environment variables
ENV PORT=8080
ENV LOG_LEVEL=INFO
ENV REFRESH_INTERVAL=30
ENV PYTHONUNBUFFERED=1

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8080/health')" || exit 1

# Run with gunicorn for production
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "--workers", "2", "--threads", "4", "--timeout", "60", "--access-logfile", "-", "--error-logfile", "-", "app.main:app"]
