import React from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUserStore } from '@/store/userStore';
import { useOrderStore } from '@/store/orderStore';
import { FileText, Download, Calendar, TrendingUp, Users, Package, RefreshCw } from 'lucide-react';

const AdminReports: React.FC = () => {
  const { user } = useUserStore();
  const { orders } = useOrderStore();

  if (!user) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </AdminLayout>
    );
  }

  // Calculate report data
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => sum + order.total_amount, 0);
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const completedOrders = orders.filter(order => order.status === 'delivered').length;
  const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Generate and download platform reports</p>
        </div>

        {/* Report Generation */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Sales Report */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Sales Report</span>
              </CardTitle>
              <CardDescription>Generate sales and revenue reports</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input id="start-date" type="date" className="mt-2" />
                </div>
                <div>
                  <Label htmlFor="end-date">End Date</Label>
                  <Input id="end-date" type="date" className="mt-2" />
                </div>
              </div>
              <div>
                <Label htmlFor="report-format">Format</Label>
                <select id="report-format" className="w-full mt-2 p-2 border rounded-md">
                  <option value="pdf">PDF</option>
                  <option value="excel">Excel</option>
                  <option value="csv">CSV</option>
                </select>
              </div>
              <Button className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Generate Sales Report
              </Button>
            </CardContent>
          </Card>

          {/* User Report */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>User Report</span>
              </CardTitle>
              <CardDescription>Generate user activity and registration reports</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="user-type">User Type</Label>
                <select id="user-type" className="w-full mt-2 p-2 border rounded-md">
                  <option value="all">All Users</option>
                  <option value="customers">Customers</option>
                  <option value="cooks">Cooks</option>
                  <option value="delivery_agents">Delivery Agents</option>
                  <option value="admins">Admins</option>
                </select>
              </div>
              <div>
                <Label htmlFor="user-format">Format</Label>
                <select id="user-format" className="w-full mt-2 p-2 border rounded-md">
                  <option value="pdf">PDF</option>
                  <option value="excel">Excel</option>
                  <option value="csv">CSV</option>
                </select>
              </div>
              <Button className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Generate User Report
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Reports */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Quick Reports</CardTitle>
              <CardDescription>Generate common reports instantly</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button variant="outline" className="h-20 flex-col">
                  <FileText className="h-6 w-6 mb-2" />
                  <span>Daily Summary</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Package className="h-6 w-6 mb-2" />
                  <span>Order Status</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Users className="h-6 w-6 mb-2" />
                  <span>User Growth</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <TrendingUp className="h-6 w-6 mb-2" />
                  <span>Performance</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Report History */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Report History</CardTitle>
              <CardDescription>Recently generated reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    id: 1,
                    name: 'Sales Report - January 2024',
                    type: 'Sales',
                    generated: '2024-01-20T10:00:00Z',
                    format: 'PDF',
                    size: '2.3 MB'
                  },
                  {
                    id: 2,
                    name: 'User Activity Report - Week 3',
                    type: 'Users',
                    generated: '2024-01-19T15:30:00Z',
                    format: 'Excel',
                    size: '1.8 MB'
                  },
                  {
                    id: 3,
                    name: 'Order Performance - Q4 2023',
                    type: 'Orders',
                    generated: '2024-01-18T09:15:00Z',
                    format: 'PDF',
                    size: '3.1 MB'
                  }
                ].map((report) => (
                  <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium">{report.name}</h4>
                        <p className="text-sm text-gray-500">
                          {report.type} • {report.format} • {report.size}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">
                        {new Date(report.generated).toLocaleDateString()}
                      </span>
                      <Button size="sm" variant="outline">
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Scheduled Reports */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Reports</CardTitle>
              <CardDescription>Automatically generated reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    id: 1,
                    name: 'Weekly Sales Summary',
                    frequency: 'Every Monday at 9:00 AM',
                    recipients: 'admin@chefsync.com',
                    active: true
                  },
                  {
                    id: 2,
                    name: 'Monthly User Report',
                    frequency: '1st of every month at 8:00 AM',
                    recipients: 'admin@chefsync.com, manager@chefsync.com',
                    active: true
                  },
                  {
                    id: 3,
                    name: 'Daily Order Status',
                    frequency: 'Every day at 6:00 PM',
                    recipients: 'kitchen@chefsync.com',
                    active: false
                  }
                ].map((schedule) => (
                  <div key={schedule.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{schedule.name}</h4>
                      <p className="text-sm text-gray-500">{schedule.frequency}</p>
                      <p className="text-sm text-gray-500">To: {schedule.recipients}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        schedule.active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {schedule.active ? 'Active' : 'Inactive'}
                      </span>
                      <Button size="sm" variant="outline">
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminReports;











