/**
 * Fee Estimate Component
 * Displays estimated transaction fees with warnings
 * Issue #599
 */

import { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Loader } from '../../components/ui/Loader';
import type { FeeEstimation } from '../../services/gasEstimation';

interface FeeEstimateProps {
  estimation: FeeEstimation | null;
  loading?: boolean;
  showBreakdown?: boolean;
}

export function FeeEstimate({ estimation, loading, showBreakdown = false }: FeeEstimateProps) {
  if (loading) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2">
          <Loader size="sm" />
          <span className="text-sm text-gray-600">Estimating fee...</span>
        </div>
      </Card>
    );
  }

  if (!estimation) {
    return null;
  }

  return (
    <Card className="p-4">
      <div className="space-y-3">
        {/* Main Fee Display */}
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">Estimated Fee:</span>
          <div className="flex items-center gap-2">
            <span className="font-semibold">{estimation.estimatedFeeXLM} XLM</span>
            {estimation.isHighFee && (
              <Badge variant="warning" size="sm">
                High Fee
              </Badge>
            )}
          </div>
        </div>

        {/* Warnings */}
        {estimation.isHighFee && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              ⚠️ This transaction has a higher than usual fee. Consider waiting for network
              congestion to decrease.
            </p>
          </div>
        )}

        {!estimation.hasSufficientBalance && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800">
              ❌ Insufficient balance to cover transaction amount and fees.
            </p>
          </div>
        )}

        {/* Fee Breakdown */}
        {showBreakdown && (
          <details className="text-sm">
            <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
              Fee Breakdown
            </summary>
            <div className="mt-2 space-y-2 pl-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Base Fee:</span>
                <span className="font-mono">
                  {(Number(estimation.baseFee) / 10_000_000).toFixed(7)} XLM
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Resource Fees:</span>
                <span className="font-mono">
                  {(Number(estimation.resourceFees) / 10_000_000).toFixed(7)} XLM
                </span>
              </div>
              {estimation.breakdown && (
                <>
                  <div className="border-t pt-2 mt-2">
                    <p className="text-xs text-gray-500 mb-1">Resource Usage:</p>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">CPU Instructions:</span>
                    <span className="font-mono">{estimation.breakdown.cpuInstructions.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Memory:</span>
                    <span className="font-mono">{estimation.breakdown.memoryBytes.toLocaleString()} bytes</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Read:</span>
                    <span className="font-mono">{estimation.breakdown.readBytes.toLocaleString()} bytes</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Write:</span>
                    <span className="font-mono">{estimation.breakdown.writeBytes.toLocaleString()} bytes</span>
                  </div>
                </>
              )}
            </div>
          </details>
        )}
      </div>
    </Card>
  );
}
