import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { user, signOut, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-xl text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4">EasyContract</h1>
            <p className="text-xl text-muted-foreground mb-8">
              Professional contract drafting, review, and management made simple
            </p>
            <Link to="/auth">
              <Button size="lg" className="text-lg px-8 py-3">
                Get Started
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
            <Card>
              <CardHeader>
                <CardTitle>Contract Drafting</CardTitle>
                <CardDescription>$9.99 per contract</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Professional contract creation tailored to your needs
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contract Review</CardTitle>
                <CardDescription>$4.99 per review</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Expert analysis and grading of your existing contracts
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Unlimited Drafting</CardTitle>
                <CardDescription>$25/month</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Unlimited contract drafting for growing businesses
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Everything Unlimited</CardTitle>
                <CardDescription>$29.99/month</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Full access to all features - drafting, review, and more
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">Welcome back!</h1>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
          <Button onClick={signOut} variant="outline">
            Sign Out
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Draft Contract</CardTitle>
              <CardDescription>$9.99</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Create a new professional contract
              </p>
              <Button className="w-full mt-4">Start Drafting</Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Review Contract</CardTitle>
              <CardDescription>$4.99</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Get expert review and grading
              </p>
              <Button className="w-full mt-4">Upload for Review</Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Unlimited Drafting</CardTitle>
              <CardDescription>$25/month</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Subscribe for unlimited drafting
              </p>
              <Button className="w-full mt-4">Subscribe</Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Everything Plan</CardTitle>
              <CardDescription>$29.99/month</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Full access to all features
              </p>
              <Button className="w-full mt-4">Subscribe</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
