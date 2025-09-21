import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, AlertCircle, CheckCircle, Clock, Loader2, Mail, Send } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCommunicationStats } from '@/hooks/useCommunicationStats';
import ComplaintManagement from '@/components/admin/ComplaintManagement';
import FeedbackManagement from '@/components/admin/FeedbackManagement';
import EmailTemplates from '@/components/admin/EmailTemplates';

const AdminComplaints: React.FC = () => {
  const { stats, loading, error } = useCommunicationStats();

  // Calculate derived stats
  const totalComplaints = stats?.by_type.find(type => type.communication_type === 'complaint')?.count || 0;
  const pendingReview = stats?.by_status.find(status => status.status === 'pending')?.count || 0;
  const resolved = stats?.by_status.find(status => status.status === 'resolved')?.count || 0;
  const positiveFeedback = stats?.by_type.find(type => type.communication_type === 'feedback')?.count || 0;
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Complaints & Feedback</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Manage all complaints and feedback from users</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Complaints</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Loading...</span>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{totalComplaints}</div>
                <p className="text-xs text-muted-foreground">Total complaint entries</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Loading...</span>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{pendingReview}</div>
                <p className="text-xs text-muted-foreground">Requires attention</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Loading...</span>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{resolved}</div>
                <p className="text-xs text-muted-foreground">Successfully resolved</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Positive Feedback</CardTitle>
            <MessageSquare className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Loading...</span>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{positiveFeedback}</div>
                <p className="text-xs text-muted-foreground">Positive feedback received</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Complaints & Feedback Management */}
      <Card>
        <CardHeader>
          <CardTitle>Complaints & Feedback Management</CardTitle>
          <CardDescription>
            Manage all complaints and feedback from users. View, respond, and resolve issues.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="complaints" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="complaints">Complaints</TabsTrigger>
              <TabsTrigger value="feedback">Feedback</TabsTrigger>
              <TabsTrigger value="email-replies">Email Replies</TabsTrigger>
            </TabsList>
            <TabsContent value="complaints" className="mt-6">
              <ComplaintManagement />
            </TabsContent>
            <TabsContent value="feedback" className="mt-6">
              <FeedbackManagement />
            </TabsContent>
            <TabsContent value="email-replies" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Mail className="h-5 w-5" />
                    <span>Email Reply Templates</span>
                  </CardTitle>
                  <CardDescription>
                    Manage email templates for replying to complaints and feedback
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <EmailTemplates />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminComplaints;