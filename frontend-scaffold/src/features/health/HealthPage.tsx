/**
 * Health Check Page
 * Displays build information and system status for monitoring
 * Issue #547
 */

import { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Loader } from '../../components/ui/Loader';

interface BuildInfo {
  version: string;
  environment: string;
  buildTimestamp: string;
  gitCommit: string;
}

interface HealthStatus {
  contractConnected: boolean;
  rpcEndpoint: string;
  lastChecked: string;
}

export function HealthPage() {
  const [buildInfo] = useState<BuildInfo>({
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    environment: import.meta.env.MODE || 'development',
    buildTimestamp: import.meta.env.VITE_BUILD_TIMESTAMP || new Date().toISOString(),
    gitCommit: import.meta.env.VITE_GIT_COMMIT || 'unknown',
  });

  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    setLoading(true);
    try {
      // Check contract connectivity
      const rpcUrl = import.meta.env.VITE_SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org';
      
      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getHealth',
        }),
      });

      const connected = response.ok;

      setHealthStatus({
        contractConnected: connected,
        rpcEndpoint: rpcUrl,
        lastChecked: new Date().toISOString(),
      });
    } catch (error) {
      setHealthStatus({
        contractConnected: false,
        rpcEndpoint: import.meta.env.VITE_SOROBAN_RPC_URL || 'unknown',
        lastChecked: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (connected: boolean) => {
    return connected ? (
      <Badge variant="success">Connected</Badge>
    ) : (
      <Badge variant="error">Disconnected</Badge>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">System Health</h1>

      {/* Build Information */}
      <Card className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Build Information</h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Version:</span>
            <span className="font-mono">{buildInfo.version}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Environment:</span>
            <Badge variant={buildInfo.environment === 'production' ? 'default' : 'warning'}>
              {buildInfo.environment}
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Build Timestamp:</span>
            <span className="font-mono text-sm">
              {new Date(buildInfo.buildTimestamp).toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Git Commit:</span>
            <span className="font-mono text-sm">{buildInfo.gitCommit.substring(0, 8)}</span>
          </div>
        </div>
      </Card>

      {/* Contract Connectivity */}
      <Card>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Contract Connectivity</h2>
          <button
            onClick={checkHealth}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Checking...' : 'Refresh'}
          </button>
        </div>

        {loading && !healthStatus ? (
          <div className="flex justify-center py-8">
            <Loader />
          </div>
        ) : healthStatus ? (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Status:</span>
              {getStatusBadge(healthStatus.contractConnected)}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">RPC Endpoint:</span>
              <span className="font-mono text-sm break-all max-w-md text-right">
                {healthStatus.rpcEndpoint}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Last Checked:</span>
              <span className="text-sm">
                {new Date(healthStatus.lastChecked).toLocaleString()}
              </span>
            </div>
          </div>
        ) : null}
      </Card>

      {/* JSON Output for Programmatic Checks */}
      <Card className="mt-6">
        <h2 className="text-xl font-semibold mb-4">JSON Output</h2>
        <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
          {JSON.stringify(
            {
              status: healthStatus?.contractConnected ? 'healthy' : 'unhealthy',
              build: buildInfo,
              connectivity: healthStatus,
            },
            null,
            2
          )}
        </pre>
      </Card>
    </div>
  );
}
