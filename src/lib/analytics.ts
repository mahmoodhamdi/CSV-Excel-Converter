/**
 * Simple in-memory analytics tracking for API usage.
 * Data resets on server restart. For persistent analytics, use Redis.
 */

interface ApiStats {
  totalRequests: number;
  totalConversions: number;
  successfulConversions: number;
  failedConversions: number;
  formatUsage: Record<string, number>;
  endpointHits: Record<string, number>;
  recentActivity: ActivityEntry[];
  startTime: number;
}

export interface ActivityEntry {
  timestamp: number;
  endpoint: string;
  inputFormat?: string;
  outputFormat?: string;
  success: boolean;
  duration?: number;
  fileSize?: number;
}

const MAX_RECENT_ACTIVITY = 50;

const stats: ApiStats = {
  totalRequests: 0,
  totalConversions: 0,
  successfulConversions: 0,
  failedConversions: 0,
  formatUsage: {},
  endpointHits: {},
  recentActivity: [],
  startTime: Date.now(),
};

export function trackApiRequest(endpoint: string) {
  stats.totalRequests++;
  stats.endpointHits[endpoint] = (stats.endpointHits[endpoint] || 0) + 1;
}

export function trackConversion(entry: Omit<ActivityEntry, 'timestamp'>) {
  stats.totalConversions++;
  if (entry.success) {
    stats.successfulConversions++;
  } else {
    stats.failedConversions++;
  }

  if (entry.outputFormat) {
    stats.formatUsage[entry.outputFormat] = (stats.formatUsage[entry.outputFormat] || 0) + 1;
  }
  if (entry.inputFormat) {
    stats.formatUsage[`input:${entry.inputFormat}`] = (stats.formatUsage[`input:${entry.inputFormat}`] || 0) + 1;
  }

  const activity: ActivityEntry = {
    ...entry,
    timestamp: Date.now(),
  };

  stats.recentActivity.unshift(activity);
  if (stats.recentActivity.length > MAX_RECENT_ACTIVITY) {
    stats.recentActivity = stats.recentActivity.slice(0, MAX_RECENT_ACTIVITY);
  }
}

export function getStats(): ApiStats & { uptime: number } {
  return {
    ...stats,
    uptime: Date.now() - stats.startTime,
  };
}

export function getFormattedUptime(): string {
  const ms = Date.now() - stats.startTime;
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}
