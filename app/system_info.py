"""System information collection module."""

import os
import socket
import platform
import psutil
from datetime import datetime


def get_hostname():
    """Get container/host hostname."""
    return socket.gethostname()


def get_environment_variables():
    """Get all environment variables."""
    return dict(os.environ)


def get_kubernetes_metadata():
    """Get Kubernetes metadata from environment if available."""
    k8s_info = {}

    # Common Kubernetes environment variables
    k8s_vars = {
        "KUBERNETES_SERVICE_HOST": "Kubernetes Service Host",
        "KUBERNETES_SERVICE_PORT": "Kubernetes Service Port",
        "HOSTNAME": "Pod Hostname",
        "POD_NAME": "Pod Name",
        "POD_NAMESPACE": "Pod Namespace",
        "POD_IP": "Pod IP",
        "NODE_NAME": "Node Name",
        "SERVICE_ACCOUNT": "Service Account",
    }

    for env_var, label in k8s_vars.items():
        value = os.environ.get(env_var)
        if value:
            k8s_info[label] = value

    # Check if running in Kubernetes
    k8s_info["In Kubernetes"] = (
        "Yes" if os.path.exists("/var/run/secrets/kubernetes.io") else "No"
    )

    return k8s_info if k8s_info else None


def get_system_resources():
    """Get system resource information."""
    try:
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage("/")

        return {
            "CPU Usage": f"{cpu_percent}%",
            "CPU Count": psutil.cpu_count(),
            "Memory Total": f"{memory.total / (1024**3):.2f} GB",
            "Memory Used": f"{memory.used / (1024**3):.2f} GB",
            "Memory Percent": f"{memory.percent}%",
            "Disk Total": f"{disk.total / (1024**3):.2f} GB",
            "Disk Used": f"{disk.used / (1024**3):.2f} GB",
            "Disk Percent": f"{disk.percent}%",
        }
    except Exception as e:
        return {"Error": str(e)}


def get_network_info():
    """Get network information."""
    try:
        hostname = socket.gethostname()
        ip_address = socket.gethostbyname(hostname)

        network_info = {
            "Hostname": hostname,
            "IP Address": ip_address,
            "FQDN": socket.getfqdn(),
        }

        # Get all network interfaces
        addrs = psutil.net_if_addrs()
        for interface, addr_list in addrs.items():
            for addr in addr_list:
                if addr.family == socket.AF_INET:
                    network_info[f"Interface {interface}"] = addr.address

        return network_info
    except Exception as e:
        return {"Error": str(e)}


def get_platform_info():
    """Get platform and OS information."""
    return {
        "Platform": platform.platform(),
        "System": platform.system(),
        "Release": platform.release(),
        "Version": platform.version(),
        "Machine": platform.machine(),
        "Processor": platform.processor() or "N/A",
        "Python Version": platform.python_version(),
    }


def get_request_info(request):
    """Get information about the incoming request."""
    return {
        "Method": request.method,
        "Path": request.path,
        "Remote Address": request.remote_addr,
        "User Agent": request.headers.get("User-Agent", "N/A"),
        "Headers": dict(request.headers),
    }


def get_all_info(request=None):
    """Collect all system information."""
    info = {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "hostname": get_hostname(),
        "platform": get_platform_info(),
        "environment": get_environment_variables(),
        "kubernetes": get_kubernetes_metadata(),
        "resources": get_system_resources(),
        "network": get_network_info(),
    }

    if request:
        info["request"] = get_request_info(request)

    return info
