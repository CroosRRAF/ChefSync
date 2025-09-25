import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ChefHat, 
  ClipboardList, 
  CheckCircle2, 
  Package, 
  Star,
  TrendingUp,
  Clock,
  Users
} from "lucide-react";

export default function Dashboard() {
  const stats = [
    {
      title: "Menu Items",
      value: "42",
      change: "+3 this week",
      icon: ChefHat,
      color: "text-primary",
      bgColor: "bg-primary/10"
    },
    {
      title: "Active Orders",
      value: "18",
      change: "+5 today",
      icon: ClipboardList,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-900/20"
    },
    {
      title: "Completed Orders",
      value: "127",
      change: "+12 today",
      icon: CheckCircle2,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-900/20"
    },
    {
      title: "Bulk Orders",
      value: "8",
      change: "+2 pending",
      icon: Package,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-900/20"
    }
  ];

  const reviews = [
    {
      customer: "Sarah Johnson",
      rating: 5,
      comment: "Amazing pasta! The flavors were incredible.",
      dish: "Truffle Pasta",
      time: "2 hours ago"
    },
    {
      customer: "Mike Chen",
      rating: 5,
      comment: "Best burger I've had in years. Will order again!",
      dish: "Chef's Special Burger",
      time: "4 hours ago"
    },
    {
      customer: "Emma Wilson",
      rating: 4,
      comment: "Great presentation and taste. Loved the seasoning.",
      dish: "Grilled Salmon",
      time: "6 hours ago"
    }
  ];

  const recentActivity = [
    { action: "New order received", time: "5 minutes ago", icon: ClipboardList },
    { action: "Menu item approved", time: "1 hour ago", icon: CheckCircle2 },
    { action: "Bulk order collaboration", time: "2 hours ago", icon: Users },
    { action: "Customer review received", time: "3 hours ago", icon: Star }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Good Morning, Chef!</h1>
          <p className="text-muted-foreground mt-1">Here's what's happening in your kitchen today</p>
        </div>
        <Badge variant="secondary" className="px-3 py-1">
          <Clock className="h-3 w-3 mr-1" />
          Live Dashboard
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="chef-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-card-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-card-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Reviews */}
        <Card className="chef-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-accent" />
              Recent Customer Reviews
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {reviews.map((review, index) => (
              <div key={index} className="border-b border-border pb-4 last:border-b-0 last:pb-0">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-card-foreground">{review.customer}</p>
                    <p className="text-sm text-muted-foreground">{review.dish}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`h-3 w-3 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300 dark:text-gray-600"}`} 
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-card-foreground mb-1">"{review.comment}"</p>
                <p className="text-xs text-muted-foreground">{review.time}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="chef-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <activity.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-card-foreground">{activity.action}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
