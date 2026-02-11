import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ThemeToggle';
import { RefreshButton } from '@/components/RefreshButton';
import { StatusIndicator } from '@/components/StatusIndicator';
import type { SystemInfo } from '@/lib/systemInfo';

interface DashboardProps {
  refreshInterval: number;
}

export function Dashboard({ refreshInterval }: DashboardProps) {
  const [data, setData] = useState<SystemInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const fetchData = async () => {
    try {
      const response = await fetch('/api/info');
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      const info = await response.json();
      setData(info);
      setError(null);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  useEffect(() => {
    fetchData();

    if (refreshInterval > 0) {
      const interval = setInterval(fetchData, refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [refreshInterval]);

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-4 md:p-8 max-w-7xl">
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Failed to fetch environment data: {error}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-4 md:p-8 max-w-7xl">
          <Card>
            <CardHeader>
              <CardTitle>Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Fetching environment data...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 md:p-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div>
              <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl mb-2">
                Canary Piet
              </h1>
              <p className="text-muted-foreground text-sm">
                Environment Information Dashboard
              </p>
            </div>
            <div className="flex gap-2">
              <ThemeToggle />
              <RefreshButton onRefresh={fetchData} />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <StatusIndicator />
            <span className="text-xs text-muted-foreground">
              {lastUpdated && `Last updated: ${lastUpdated}`}
            </span>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Container Information */}
          <Card>
            <CardHeader>
              <CardTitle>Container Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b last:border-0">
                  <span className="text-sm font-medium text-muted-foreground">Hostname</span>
                  <Badge>{data.hostname}</Badge>
                </div>
                <div className="flex items-center justify-between py-2 border-b last:border-0">
                  <span className="text-sm font-medium text-muted-foreground">Timestamp</span>
                  <span className="text-sm">{data.timestamp}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Platform Information */}
          {data.platform && (
            <Card>
              <CardHeader>
                <CardTitle>Platform</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(data.platform).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between py-2 border-b last:border-0">
                      <span className="text-sm font-medium text-muted-foreground">{key}</span>
                      <span className="text-sm">{value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* System Resources */}
          {data.resources && (
            <Card>
              <CardHeader>
                <CardTitle>System Resources</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(data.resources).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between py-2 border-b last:border-0">
                      <span className="text-sm font-medium text-muted-foreground">{key}</span>
                      <span className="text-sm font-semibold">{value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Network Information */}
          {data.network && (
            <Card>
              <CardHeader>
                <CardTitle>Network</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(data.network).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between py-2 border-b last:border-0">
                      <span className="text-sm font-medium text-muted-foreground">{key}</span>
                      <span className="text-sm break-all">{value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Kubernetes Information */}
          {data.kubernetes && Object.keys(data.kubernetes).length > 0 && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Kubernetes / Container Orchestration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(data.kubernetes).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between py-2 border-b last:border-0">
                      <span className="text-sm font-medium text-muted-foreground">{key}</span>
                      <Badge variant="outline">{value}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Request Information */}
          {data.request && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Request Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-6">
                  {Object.entries(data.request)
                    .filter(([key]) => key !== 'Headers')
                    .map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between py-2 border-b last:border-0">
                        <span className="text-sm font-medium text-muted-foreground">{key}</span>
                        <span className="text-sm break-all">{value}</span>
                      </div>
                    ))}
                </div>
                <div className="mt-6">
                  <h3 className="text-lg font-semibold tracking-tight mb-3">Request Headers</h3>
                  <div className="rounded-md border bg-muted p-4">
                    <pre className="text-xs font-mono overflow-x-auto text-foreground">
                      {JSON.stringify(data.request.Headers, null, 2)}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Environment Variables */}
          {data.environment && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle>Environment Variables</CardTitle>
                  <Badge variant="outline">{Object.keys(data.environment).length} total</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border bg-muted p-4 max-h-96 overflow-y-auto">
                  <pre className="text-xs font-mono text-foreground">
                    {Object.entries(data.environment)
                      .sort((a, b) => a[0].localeCompare(b[0]))
                      .map(([key, value]) => `${key}=${value}`)
                      .join('\n')}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
