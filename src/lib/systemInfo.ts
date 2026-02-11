import os from 'os';
import fs from 'fs';
import si from 'systeminformation';

export interface SystemInfo {
  timestamp: string;
  hostname: string;
  platform: Record<string, string>;
  environment: Record<string, string>;
  kubernetes: Record<string, string> | null;
  resources: Record<string, string>;
  network: Record<string, string>;
  request?: Record<string, any>;
}

export function getHostname(): string {
  return os.hostname();
}

export function getEnvironmentVariables(): Record<string, string> {
  return process.env as Record<string, string>;
}

export function getKubernetesMetadata(): Record<string, string> | null {
  const k8sInfo: Record<string, string> = {};

  // Common Kubernetes environment variables
  const k8sVars: Record<string, string> = {
    KUBERNETES_SERVICE_HOST: 'Kubernetes Service Host',
    KUBERNETES_SERVICE_PORT: 'Kubernetes Service Port',
    HOSTNAME: 'Pod Hostname',
    POD_NAME: 'Pod Name',
    POD_NAMESPACE: 'Pod Namespace',
    POD_IP: 'Pod IP',
    NODE_NAME: 'Node Name',
    SERVICE_ACCOUNT: 'Service Account',
  };

  for (const [envVar, label] of Object.entries(k8sVars)) {
    const value = process.env[envVar];
    if (value) {
      k8sInfo[label] = value;
    }
  }

  // Check if running in Kubernetes
  const inK8s = fs.existsSync('/var/run/secrets/kubernetes.io');
  k8sInfo['In Kubernetes'] = inK8s ? 'Yes' : 'No';

  return Object.keys(k8sInfo).length > 0 ? k8sInfo : null;
}

export async function getSystemResources(): Promise<Record<string, string>> {
  try {
    // Get CPU info
    const cpuLoad = await si.currentLoad();
    const cpuCount = os.cpus().length;

    // Get memory info
    const mem = await si.mem();

    // Get disk info
    const disks = await si.fsSize();
    const mainDisk = disks[0] || { size: 0, used: 0, use: 0 };

    return {
      'CPU Usage': `${cpuLoad.currentLoad.toFixed(2)}%`,
      'CPU Count': cpuCount.toString(),
      'Memory Total': `${(mem.total / (1024 ** 3)).toFixed(2)} GB`,
      'Memory Used': `${(mem.used / (1024 ** 3)).toFixed(2)} GB`,
      'Memory Percent': `${((mem.used / mem.total) * 100).toFixed(2)}%`,
      'Disk Total': `${(mainDisk.size / (1024 ** 3)).toFixed(2)} GB`,
      'Disk Used': `${(mainDisk.used / (1024 ** 3)).toFixed(2)} GB`,
      'Disk Percent': `${mainDisk.use.toFixed(2)}%`,
    };
  } catch (error) {
    return { Error: String(error) };
  }
}

export async function getNetworkInfo(): Promise<Record<string, string>> {
  try {
    const hostname = os.hostname();
    const networkInfo: Record<string, string> = {
      Hostname: hostname,
      FQDN: hostname, // Node.js doesn't have a direct equivalent to Python's getfqdn()
    };

    // Get all network interfaces
    const interfaces = os.networkInterfaces();
    for (const [name, addrs] of Object.entries(interfaces)) {
      if (addrs) {
        for (const addr of addrs) {
          if (addr.family === 'IPv4') {
            networkInfo[`Interface ${name}`] = addr.address;
            // Set IP Address to first non-loopback IPv4
            if (!networkInfo['IP Address'] && addr.address !== '127.0.0.1') {
              networkInfo['IP Address'] = addr.address;
            }
          }
        }
      }
    }

    // Ensure IP Address is set (fallback to loopback if needed)
    if (!networkInfo['IP Address']) {
      networkInfo['IP Address'] = '127.0.0.1';
    }

    return networkInfo;
  } catch (error) {
    return { Error: String(error) };
  }
}

export function getPlatformInfo(): Record<string, string> {
  return {
    Platform: `${os.type()} ${os.release()}`,
    System: os.type(),
    Release: os.release(),
    Version: os.version(),
    Machine: os.arch(),
    Processor: os.cpus()[0]?.model || 'N/A',
    'Node.js Version': process.version,
  };
}

export function getRequestInfo(request: Request): Record<string, any> {
  const url = new URL(request.url);
  const headers: Record<string, string> = {};
  
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });

  return {
    Method: request.method,
    Path: url.pathname,
    'Remote Address': request.headers.get('x-forwarded-for') || 'N/A',
    'User Agent': request.headers.get('user-agent') || 'N/A',
    Headers: headers,
  };
}

export async function getAllInfo(request?: Request): Promise<SystemInfo> {
  const [resources, network] = await Promise.all([
    getSystemResources(),
    getNetworkInfo(),
  ]);

  const info: SystemInfo = {
    timestamp: new Date().toISOString(),
    hostname: getHostname(),
    platform: getPlatformInfo(),
    environment: getEnvironmentVariables(),
    kubernetes: getKubernetesMetadata(),
    resources,
    network,
  };

  if (request) {
    info.request = getRequestInfo(request);
  }

  return info;
}
