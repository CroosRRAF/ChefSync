import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  referralService,
  type ReferralStats,
  type ReferralToken,
} from "@/services/referralService";
import {
  CheckCircle,
  Clock,
  Copy,
  ExternalLink,
  Plus,
  RefreshCw,
  TrendingUp,
  Users,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";

/**
 * Referral Management Page
 *
 * Features:
 * - View referral statistics
 * - Manage referral tokens
 * - Create new tokens
 * - Track referral performance
 * - View top referrers
 */

const ReferralManagement: React.FC = () => {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [tokens, setTokens] = useState<ReferralToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [maxUses, setMaxUses] = useState<string>("");
  const [expiresAt, setExpiresAt] = useState<string>("");

  // Load data
  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [statsData, tokensData] = await Promise.all([
        referralService.getReferralStats(),
        referralService.getReferralTokens(),
      ]);
      setStats(statsData);
      setTokens(tokensData);
    } catch (error) {
      console.error("Error loading referral data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Create new referral token
  const handleCreateToken = async () => {
    setCreating(true);
    try {
      const payload: any = {};
      if (maxUses) payload.max_uses = parseInt(maxUses);
      if (expiresAt) payload.expires_at = expiresAt;

      await referralService.createReferralToken(payload);
      setShowCreateDialog(false);
      setMaxUses("");
      setExpiresAt("");
      loadData(true);
    } catch (error) {
      console.error("Error creating token:", error);
    } finally {
      setCreating(false);
    }
  };

  // Copy referral link
  const handleCopyLink = async (token: string) => {
    await referralService.copyReferralLink(token);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get status badge
  const getStatusBadge = (token: ReferralToken) => {
    if (!token.is_active) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    if (token.expires_at && new Date(token.expires_at) < new Date()) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    if (token.max_uses && token.uses >= token.max_uses) {
      return <Badge variant="secondary">Max Uses Reached</Badge>;
    }
    return (
      <Badge variant="default" className="bg-green-500">
        Active
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Referral Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage referral tokens and track performance
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => loadData()} size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowCreateDialog(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Create Token
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_tokens || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.active_tokens || 0} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Referrals
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.total_referrals || 0}
            </div>
            <p className="text-xs text-muted-foreground">All time referrals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Successful</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.successful_referrals || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Completed registrations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.pending_referrals || 0}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting completion</p>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Rate */}
      {stats && stats.total_referrals > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">
              {stats.conversion_rate.toFixed(1)}%
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {stats.successful_referrals} successful out of{" "}
              {stats.total_referrals} total referrals
            </p>
          </CardContent>
        </Card>
      )}

      {/* Referral Tokens Table */}
      <Card>
        <CardHeader>
          <CardTitle>Referral Tokens</CardTitle>
        </CardHeader>
        <CardContent>
          {tokens.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No referral tokens yet</p>
              <Button
                onClick={() => setShowCreateDialog(true)}
                className="mt-4"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First Token
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Token</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Referrer</TableHead>
                  <TableHead>Uses</TableHead>
                  <TableHead>Successful</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tokens.map((token) => (
                  <TableRow key={token.id}>
                    <TableCell className="font-mono text-sm">
                      {token.token.substring(0, 12)}...
                    </TableCell>
                    <TableCell>{getStatusBadge(token)}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{token.referrer.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {token.referrer.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {token.uses}
                      {token.max_uses && ` / ${token.max_uses}`}
                    </TableCell>
                    <TableCell>{token.successful_referrals}</TableCell>
                    <TableCell className="text-sm">
                      {formatDate(token.created_at)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {token.expires_at
                        ? formatDate(token.expires_at)
                        : "Never"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyLink(token.token)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            window.open(
                              referralService.generateReferralLink(token.token),
                              "_blank"
                            )
                          }
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Top Referrers */}
      {stats && stats.top_referrers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Referrers</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Referrer</TableHead>
                  <TableHead>Total Referrals</TableHead>
                  <TableHead>Successful</TableHead>
                  <TableHead>Success Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.top_referrers.map((referrer, index) => (
                  <TableRow key={referrer.user.id}>
                    <TableCell className="font-bold">#{index + 1}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{referrer.user.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {referrer.user.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{referrer.referral_count}</TableCell>
                    <TableCell>{referrer.successful_count}</TableCell>
                    <TableCell>
                      <Badge variant="default" className="bg-green-500">
                        {referrer.referral_count > 0
                          ? (
                              (referrer.successful_count /
                                referrer.referral_count) *
                              100
                            ).toFixed(1)
                          : 0}
                        %
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Create Token Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Referral Token</DialogTitle>
            <DialogDescription>
              Create a new referral token with optional limits
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="max_uses">Max Uses (Optional)</Label>
              <Input
                id="max_uses"
                type="number"
                placeholder="Unlimited"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expires_at">Expires At (Optional)</Label>
              <Input
                id="expires_at"
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateToken} disabled={creating}>
              {creating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Token
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReferralManagement;
