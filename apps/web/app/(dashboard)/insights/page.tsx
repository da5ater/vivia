"use client";

import { useQuery, useAction } from "convex/react";
import { api } from "@workspace/backend/convex/_generated/api";
import {
  SparklesIcon,
  LightbulbIcon,
  RefreshCwIcon,
  InboxIcon,
  ClockIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  SmartphoneIcon,
  MessageSquareIcon,
  GlobeIcon,
  MapPinIcon,
  TrendingUpIcon,
  ZapIcon,
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@workspace/ui/lib/utils";
import { Protect } from "@clerk/nextjs";
import { PremiumFeaturesOverlay } from "@/modules/billing/ui/components/premium-features-overlay";

export default function InsightsPage() {
  const stats = useQuery(api.private.conversations.getStats);
  const generateInsights = useAction(api.private.insights.generateOrgInsights);

  const [insights, setInsights] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await generateInsights();
      setInsights(result);
    } catch (err: any) {
      setError(err.message || "Failed to generate insights.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  const totalCount = stats === undefined ? null : stats.total;
  const openCount = stats === undefined ? null : stats.unresolved;
  const resolvedCount = stats === undefined ? null : stats.resolved;
  const escalatedCount = stats === undefined ? null : stats.escalated;

  const channelStats = stats?.channelStats ?? { web: 0, whatsapp: 0, messenger: 0 };
  const countryStats = stats?.countryStats ?? {};

  // Channel metrics
  const webCount = channelStats.web || 0;
  const whatsappCount = channelStats.whatsapp || 0;
  const messengerCount = channelStats.messenger || 0;
  const totalChannelCount = webCount + whatsappCount + messengerCount || 1;

  const webPercent = Math.round((webCount / totalChannelCount) * 100);
  const whatsappPercent = Math.round((whatsappCount / totalChannelCount) * 100);
  const messengerPercent = Math.round((messengerCount / totalChannelCount) * 100);

  // Geographic metrics
  const sortedTimezones = Object.entries(countryStats)
    .map(([tz, count]) => ({ tz, count: count as number }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const totalGeographicCount = sortedTimezones.reduce((sum, item) => sum + item.count, 0) || 1;

  // KPIs
  const resolutionRate = totalCount && totalCount > 0 ? Math.round((resolvedCount! / totalCount) * 100) : 0;
  const escalationRate = totalCount && totalCount > 0 ? Math.round((escalatedCount! / totalCount) * 100) : 0;

  const formatTimezone = (tz: string) => {
    const parts = tz.split("/");
    if (parts.length === 2 && parts[0] && parts[1]) {
      const region = parts[0];
      const city = parts[1].replace("_", " ");
      const flags: Record<string, string> = {
        Africa: "🌍",
        Europe: "🇪🇺",
        America: "🇺🇸",
        Asia: "🌏",
        Australia: "🇦🇺",
        Pacific: "🌊",
      };
      const flag = flags[region] || "📍";
      return `${flag} ${city} (${region})`;
    }
    return `📍 ${tz}`;
  };

  const renderMarkdown = (text: string) => {
    return text.split("\n").map((line, i) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("### ")) {
        return (
          <h3 key={i} className="text-base font-semibold mt-4 mb-2 text-foreground tracking-tight flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-amber-500" />
            {trimmed.replace("### ", "")}
          </h3>
        );
      }
      if (trimmed.startsWith("## ")) {
        return (
          <h2 key={i} className="text-lg font-bold mt-6 mb-3 text-foreground border-l-2 border-amber-500 pl-3">
            {trimmed.replace("## ", "")}
          </h2>
        );
      }
      if (trimmed.startsWith("# ")) {
        return (
          <h1 key={i} className="text-xl font-extrabold mt-8 mb-4 text-foreground tracking-tight bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
            {trimmed.replace("# ", "")}
          </h1>
        );
      }
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        const content = trimmed.replace(/^[-*]\s+/, "");
        return (
          <li key={i} className="ml-4 pl-1 list-none mb-2 text-sm text-muted-foreground flex items-start gap-2.5 leading-relaxed">
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-slate-300 dark:bg-slate-700" />
            <span>{renderBold(content)}</span>
          </li>
        );
      }
      if (trimmed === "") return <div key={i} className="h-3" />;

      return (
        <p key={i} className="mb-3 text-sm text-muted-foreground leading-relaxed">
          {renderBold(trimmed)}
        </p>
      );
    });
  };

  const renderBold = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, j) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={j} className="font-semibold text-foreground">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  const content = (
    <div className="flex flex-col flex-1 gap-8 max-w-6xl mx-auto w-full p-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <LightbulbIcon className="size-4 text-amber-500" />
          <p className="text-xs text-amber-500 font-semibold tracking-wider uppercase">
            Intelligence & Analytics
          </p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-slate-200 dark:to-white bg-clip-text text-transparent">
            AI Insights & Analytics
          </h1>
          <button
            onClick={fetchInsights}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg font-medium hover:bg-sky-600 transition-all shadow-sm hover:shadow active:scale-95 disabled:opacity-50"
          >
            <RefreshCwIcon className={cn("size-4", loading && "animate-spin")} />
            {loading ? "Analyzing Data..." : "Refresh Insights"}
          </button>
        </div>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          Review statistics and receive actionable recommendations generated by AI based on your organization's recent conversations.
        </p>
      </div>

      {/* ── Core Metric Cards Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Conversations */}
        <div className="flex flex-col gap-1 p-5 rounded-2xl border border-border/80 bg-card shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Conversations</span>
            <div className="size-8 rounded-lg bg-indigo-100 dark:bg-indigo-500/10 flex items-center justify-center transition-colors group-hover:bg-indigo-200 dark:group-hover:bg-indigo-500/20">
              <InboxIcon className="size-4 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
          <p className="text-3xl font-bold tracking-tight">
            {totalCount !== null ? totalCount : "..."}
          </p>
        </div>

        {/* Resolution Rate */}
        <div className="flex flex-col gap-1 p-5 rounded-2xl border border-border/80 bg-card shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Resolution Rate</span>
            <div className="size-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center transition-colors group-hover:bg-emerald-200 dark:group-hover:bg-emerald-500/20">
              <TrendingUpIcon className="size-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <p className="text-3xl font-bold tracking-tight flex items-baseline gap-1">
            {totalCount !== null ? `${resolutionRate}%` : "..."}
            <span className="text-xs font-normal text-muted-foreground">({resolvedCount} resolved)</span>
          </p>
        </div>

        {/* Escalation Rate */}
        <div className="flex flex-col gap-1 p-5 rounded-2xl border border-border/80 bg-card shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Escalation Rate</span>
            <div className="size-8 rounded-lg bg-red-100 dark:bg-red-500/10 flex items-center justify-center transition-colors group-hover:bg-red-200 dark:group-hover:bg-red-500/20">
              <ZapIcon className="size-4 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <p className="text-3xl font-bold tracking-tight flex items-baseline gap-1">
            {totalCount !== null ? `${escalationRate}%` : "..."}
            <span className="text-xs font-normal text-muted-foreground">({escalatedCount} escalated)</span>
          </p>
        </div>

        {/* Needs Action */}
        <div className="flex flex-col gap-1 p-5 rounded-2xl border border-border/80 bg-card shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Needs Action</span>
            <div className="size-8 rounded-lg bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center transition-colors group-hover:bg-amber-200 dark:group-hover:bg-amber-500/20">
              <ClockIcon className="size-4 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <p className="text-3xl font-bold tracking-tight">
            {openCount !== null ? openCount : "..."}
          </p>
        </div>
      </div>

      {/* ── Two Column Dashboard Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        
        {/* Left Hand Analytics (Channels & Timezones) - Spans 2 Columns */}
        <div className="lg:col-span-2 flex flex-col gap-6 w-full">
          
          {/* Traffic Channel breakdown */}
          <div className="rounded-2xl border border-border/85 bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-border/40 mb-5">
              <div className="flex items-center gap-2">
                <SmartphoneIcon className="size-4.5 text-muted-foreground" />
                <h3 className="font-bold text-foreground">Traffic Channels</h3>
              </div>
              <span className="text-xs text-muted-foreground">Live volume share</span>
            </div>

            {stats === undefined ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-10 bg-muted/40 rounded-xl" />
                <div className="h-10 bg-muted/40 rounded-xl" />
                <div className="h-10 bg-muted/40 rounded-xl" />
              </div>
            ) : (
              <div className="space-y-5">
                {/* Web Chat */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400">
                      <GlobeIcon className="size-3.5" />
                      <span className="font-semibold">Web Chat</span>
                    </div>
                    <span className="text-muted-foreground font-mono">{webCount} ({webPercent}%)</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sky-500 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${webPercent}%` }}
                    />
                  </div>
                </div>

                {/* WhatsApp */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                      <SmartphoneIcon className="size-3.5" />
                      <span className="font-semibold">WhatsApp</span>
                    </div>
                    <span className="text-muted-foreground font-mono">{whatsappCount} ({whatsappPercent}%)</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${whatsappPercent}%` }}
                    />
                  </div>
                </div>

                {/* Facebook Messenger */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                      <MessageSquareIcon className="size-3.5" />
                      <span className="font-semibold">Messenger</span>
                    </div>
                    <span className="text-muted-foreground font-mono">{messengerCount} ({messengerPercent}%)</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${messengerPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Regional Audience Timezones */}
          <div className="rounded-2xl border border-border/85 bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-border/40 mb-5">
              <div className="flex items-center gap-2">
                <MapPinIcon className="size-4.5 text-muted-foreground" />
                <h3 className="font-bold text-foreground">Top Regions</h3>
              </div>
              <span className="text-xs text-muted-foreground">Geographic timezones</span>
            </div>

            {stats === undefined ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-8 bg-muted/40 rounded-xl" />
                <div className="h-8 bg-muted/40 rounded-xl" />
                <div className="h-8 bg-muted/40 rounded-xl" />
              </div>
            ) : sortedTimezones.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
                <MapPinIcon className="size-8 opacity-20 mb-2" />
                <p className="text-xs">No visitor timezone data recorded yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sortedTimezones.map(({ tz, count }) => {
                  const percent = Math.round((count / totalGeographicCount) * 100);
                  return (
                    <div key={tz} className="flex flex-col gap-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-foreground truncate max-w-[190px]">
                          {formatTimezone(tz)}
                        </span>
                        <span className="text-muted-foreground font-mono font-medium">{count} ({percent}%)</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-slate-400 dark:bg-slate-500 rounded-full"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Hand Analytics (AI intelligence report) - Spans 3 Columns */}
        <div className="lg:col-span-3 rounded-2xl border border-border/85 bg-card overflow-hidden shadow-sm flex flex-col w-full min-h-[450px]">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/40 bg-muted/20">
            <div className="flex items-center gap-3">
              <SparklesIcon className="size-5 text-amber-500" />
              <h2 className="text-lg font-bold text-foreground">AI Intelligence Report</h2>
            </div>
            {insights && (
              <span className="text-xs text-muted-foreground">Generated via Llama 3.1</span>
            )}
          </div>
          <div className="p-6 md:p-8 flex-1 flex flex-col justify-center">
            {loading && !insights ? (
              <div className="flex flex-col gap-5 animate-pulse w-full">
                <div className="h-6 bg-muted/50 rounded w-1/4 mb-2"></div>
                <div className="h-4 bg-muted/30 rounded w-full"></div>
                <div className="h-4 bg-muted/30 rounded w-11/12"></div>
                <div className="h-4 bg-muted/30 rounded w-4/5"></div>

                <div className="h-6 bg-muted/50 rounded w-1/3 mt-6 mb-2"></div>
                <div className="h-4 bg-muted/30 rounded w-full"></div>
                <div className="h-4 bg-muted/30 rounded w-5/6"></div>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="size-12 rounded-full bg-red-100 dark:bg-red-500/10 flex items-center justify-center mb-4">
                  <AlertCircleIcon className="size-6 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-1">Analysis Failed</h3>
                <p className="text-muted-foreground text-sm max-w-sm">{error}</p>
              </div>
            ) : insights ? (
              <div className="w-full text-left leading-relaxed prose dark:prose-invert max-w-none">
                {renderMarkdown(insights)}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="size-16 rounded-full bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center mb-4 transition-transform hover:scale-105">
                  <LightbulbIcon className="size-8 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-1">Ready for Analysis</h3>
                <p className="text-muted-foreground text-sm max-w-sm mb-6">
                  Click the refresh button to analyze recent customer conversations and generate strategic recommendations.
                </p>
                <button
                  onClick={fetchInsights}
                  className="px-5 py-2.5 bg-amber-500 text-white rounded-lg font-semibold hover:bg-amber-600 shadow-sm active:scale-95 transition-all text-sm"
                >
                  Generate Insights
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Protect
      condition={(has) => has({ plan: "pro" })}
      fallback={
        <div className="relative h-full w-full">
          <div className="pointer-events-none select-none">
            {content}
          </div>
          <PremiumFeaturesOverlay />
        </div>
      }
    >
      {content}
    </Protect>
  );
}
