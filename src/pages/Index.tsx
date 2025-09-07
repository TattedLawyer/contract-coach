import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { TrainingContractUpload } from "@/components/TrainingContractUpload";
import { ContractAnalysis } from "@/components/ContractAnalysis";
import { useUserRole } from "@/hooks/useUserRole";
import { FileText, Upload, Shield, FileCheck, Star, Calendar, Play } from "lucide-react";

const Index = () => {
  const { user, signOut, loading } = useAuth();
  const { toast } = useToast();
  const [assigningAdmin, setAssigningAdmin] = useState(false);
  const { isAdmin } = useUserRole();

  const handleAssignAdmin = async () => {
    setAssigningAdmin(true);
    try {
      const { data, error } = await supabase.functions.invoke('assign-admin');
      
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Admin role assigned successfully!",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to assign admin role",
        variant: "destructive",
      });
    } finally {
      setAssigningAdmin(false);
    }
  };

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
      <div className="min-h-screen bg-background">
        {/* Navigation Header */}
        <nav className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-foreground">EasyContract</div>
              <div className="flex items-center gap-4">
                <Link to="/auth">
                  <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                    Log in
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                    Start Free Trial
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Client logos banner */}
        <div className="border-b border-border/40 bg-muted/30">
          <div className="container mx-auto px-6 py-6">
            <div className="flex items-center justify-center gap-8 opacity-60">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                Trusted by 500+ companies
              </div>
              <div className="w-px h-4 bg-border"></div>
              <div className="flex items-center gap-8">
                {[
                  "Microsoft", "Acer", "Bosch", "Grant Thornton"
                ].map((company) => (
                  <div key={company} className="text-sm font-medium text-muted-foreground/80">
                    {company}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <div className="container mx-auto px-6 pt-20 pb-32">
          <div className="text-center space-y-8 max-w-4xl mx-auto">
            {/* Video placeholder */}
            <div className="relative max-w-3xl mx-auto mb-12">
              <div className="aspect-video bg-gradient-to-br from-muted to-muted/60 rounded-xl border border-border/40 flex items-center justify-center group cursor-pointer hover:from-muted/80 hover:to-muted/40 transition-all duration-300">
                <div className="flex items-center gap-3 text-muted-foreground group-hover:text-foreground transition-colors">
                  <div className="p-4 rounded-full bg-primary/10 border border-primary/20">
                    <Play className="h-8 w-8 text-primary" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">See EasyContract in action</div>
                    <div className="text-sm text-muted-foreground">1:25 demo</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h1 className="text-5xl lg:text-7xl font-bold leading-tight tracking-tight">
                <span className="block text-foreground">Unblock legal to</span>
                <span className="block bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
                  unlock growth
                </span>
              </h1>
              
              <p className="text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Contract smarter, scale faster. Streamline legal review and analysis to reduce friction and fuel operational efficiency.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <Link to="/auth">
                <Button size="lg" className="text-lg px-8 py-6 bg-primary hover:bg-primary/90 text-primary-foreground">
                  Start Analyzing Contracts
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                Book a Demo
              </Button>
            </div>
            
            <p className="text-sm text-muted-foreground">
              No setup required • Instant analysis • Enterprise-grade security
            </p>
          </div>
        </div>

        {/* Key Benefits */}
        <div className="bg-muted/30 py-20">
          <div className="container mx-auto px-6">
            <div className="grid lg:grid-cols-3 gap-12">
              <div className="text-center lg:text-left space-y-4">
                <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
                  Contract smarter, scale faster
                </h2>
                <p className="text-lg text-muted-foreground">
                  Streamline legal review and drafting to reduce friction and fuel operational efficiency.
                </p>
              </div>
              
              <div className="text-center lg:text-left space-y-4">
                <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
                  Fast-track compliance, reduce risk
                </h2>
                <p className="text-lg text-muted-foreground">
                  Spot red flags instantly and stay audit-ready to cut the risk of disputes and penalties.
                </p>
              </div>
              
              <div className="text-center lg:text-left space-y-4">
                <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
                  Procure with precision and speed
                </h2>
                <p className="text-lg text-muted-foreground">
                  Automate legal checks and approvals to half vendor onboarding time without sacrificing oversight.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contract Analysis CTA */}
        <div className="py-20">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              <div className="text-center space-y-8 mb-12">
                <h2 className="text-4xl lg:text-5xl font-bold">
                  Purpose-built AI to execute
                  <span className="block text-primary">contract analysis</span>
                </h2>
                <p className="text-xl text-muted-foreground">
                  Review, analyze and extract insights from legal documents in minutes.
                </p>
              </div>

              <div className="grid lg:grid-cols-2 gap-12 items-center">
                {/* Contract upload demo */}
                <Card className="bg-card/50 backdrop-blur border-border/60">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      Contract Analysis
                    </CardTitle>
                    <CardDescription>
                      Upload your contract and get instant insights
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="border-2 border-dashed border-border/60 rounded-lg p-8 text-center space-y-3 hover:border-primary/40 transition-colors">
                      <Upload className="h-10 w-10 text-primary mx-auto" />
                      <div>
                        <p className="font-medium">Drop your contract here</p>
                        <p className="text-sm text-muted-foreground">
                          or click to browse files
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Supports PDF, DOC, DOCX • Max 10MB
                      </p>
                    </div>
                    <Link to="/auth" className="block">
                      <Button className="w-full" size="lg">
                        Get started free
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                {/* Features */}
                <div className="space-y-8">
                  <div className="flex gap-4">
                    <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                      <Shield className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Risk Detection</h3>
                      <p className="text-muted-foreground">
                        Automatically identify potential legal risks and compliance issues
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                      <FileCheck className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Instant Analysis</h3>
                      <p className="text-muted-foreground">
                        Get comprehensive contract analysis in seconds, not hours
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                      <Star className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Key Insights</h3>
                      <p className="text-muted-foreground">
                        Extract important terms, obligations, and deadlines automatically
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Welcome back</h1>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
          <div className="flex gap-2">
            {user.email === 'tatted@mnnt.io' && (
              <Button 
                onClick={handleAssignAdmin} 
                disabled={assigningAdmin}
                variant="secondary"
              >
                {assigningAdmin ? 'Assigning...' : 'Assign Admin Role'}
              </Button>
            )}
            <Button onClick={signOut} variant="outline">
              Sign Out
            </Button>
          </div>
        </div>

        {/* Admin Panel */}
        {isAdmin && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Admin Panel</h2>
            <TrainingContractUpload />
          </div>
        )}

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Contract Analysis</CardTitle>
              <CardDescription>
                Upload and analyze your contracts for insights and risk assessment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ContractAnalysis />
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full" variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Contract
                </Button>
                <Button className="w-full" variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />
                  View History
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
