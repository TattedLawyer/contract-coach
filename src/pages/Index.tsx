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
              <div className="text-2xl font-bold text-foreground">Contract Coach</div>
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

        {/* Trust indicators */}
        <div className="border-b border-border/40 bg-background/50">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Enterprise-grade security
              </div>
              <div className="w-px h-4 bg-border"></div>
              <div>GDPR compliant</div>
              <div className="w-px h-4 bg-border"></div>
              <div>24/7 support</div>
            </div>
          </div>
        </div>

        {/* Hero Section - Contract Drafting/Analysis */}
        <div className="container mx-auto px-6 pt-20 pb-32">
          <div className="text-center space-y-8 max-w-4xl mx-auto">
            <div className="space-y-6">
              <h1 className="text-5xl lg:text-7xl font-bold leading-tight tracking-tight">
                <span className="block text-foreground">Draft & Analyze</span>
                <span className="block bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
                  Contracts Smarter
                </span>
              </h1>

              <p className="text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Professional contract drafting and AI-powered analysis. Choose your path below.
              </p>
            </div>

            {/* Contract Options */}
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mt-12">
              <Link to="/auth" className="block">
                <Card className="h-full hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/50 cursor-pointer group">
                  <CardContent className="p-8 text-center space-y-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto group-hover:bg-primary/20 transition-colors">
                      <FileText className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold mb-2">Draft Contract</h3>
                      <p className="text-muted-foreground mb-4">
                        Create professional contracts with our guided wizard. Choose from service agreements, NDAs, employment contracts, and more.
                      </p>
                      <Button size="lg" className="w-full">
                        Start Drafting
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link to="/auth" className="block">
                <Card className="h-full hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/50 cursor-pointer group">
                  <CardContent className="p-8 text-center space-y-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto group-hover:bg-primary/20 transition-colors">
                      <Shield className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold mb-2">Analyze Contract</h3>
                      <p className="text-muted-foreground mb-4">
                        Upload existing contracts for AI-powered analysis, risk detection, and compliance review.
                      </p>
                      <Button size="lg" variant="outline" className="w-full">
                        Start Analyzing
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>

            <p className="text-sm text-muted-foreground pt-4">
              Free trial available • No credit card required • Enterprise-grade security
            </p>
          </div>
        </div>

        {/* Features Section - Industry-Leading Contract Tools */}
        <div className="py-20">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                Industry-Leading Contract Intelligence
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Everything you need for professional contract management, included in every plan.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
              {/* Feature Cards */}
              <div className="space-y-8">
                <div className="flex gap-4">
                  <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 flex-shrink-0">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Risk Detection & Compliance</h3>
                    <p className="text-muted-foreground">
                      Automatically identify potential legal risks, compliance issues, and unfavorable terms with AI-powered analysis.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 flex-shrink-0">
                    <FileCheck className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Instant Analysis</h3>
                    <p className="text-muted-foreground">
                      Get comprehensive contract analysis in seconds, not hours. Extract key terms, obligations, and deadlines automatically.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 flex-shrink-0">
                    <Star className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Professional Drafting</h3>
                    <p className="text-muted-foreground">
                      Create legally sound contracts with our guided wizard. Choose from service agreements, NDAs, employment contracts, and more.
                    </p>
                  </div>
                </div>
              </div>

              {/* Demo Card */}
              <Card className="bg-card/50 backdrop-blur border-border/60">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Try Contract Analysis
                  </CardTitle>
                  <CardDescription>
                    Upload your contract and see instant insights
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
                      Supports PDF, DOC, DOCX • Max 25MB
                    </p>
                  </div>
                  <Link to="/auth" className="block">
                    <Button className="w-full" size="lg">
                      Start Free Trial
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-muted/30 py-20">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                  Frequently Asked Questions
                </h2>
                <p className="text-xl text-muted-foreground">
                  Everything you need to know about contract drafting and analysis.
                </p>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-3">How do I get started with contract drafting?</h3>
                    <p className="text-muted-foreground">
                      Simply sign up for a free trial, choose "Draft Contract" from the main dashboard, and follow our guided wizard.
                      Select your contract type, answer a few questions about the parties and terms, and we'll generate a professional contract for you.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-3">What types of contracts can you help me create?</h3>
                    <p className="text-muted-foreground">
                      We support service agreements, independent contractor agreements, consulting agreements, employment contracts,
                      partnership agreements, license agreements, and non-disclosure agreements. For other contract types, you can use our custom drafting option.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-3">How does contract analysis work?</h3>
                    <p className="text-muted-foreground">
                      Upload your existing contract (PDF, DOC, or DOCX format up to 25MB), and our AI will analyze it for risks, compliance issues,
                      key terms, and provide a detailed grade and improvement suggestions. Analysis typically takes just a few seconds.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-3">Is my data secure?</h3>
                    <p className="text-muted-foreground">
                      Yes, we use enterprise-grade security with end-to-end encryption. Your contracts are processed securely and
                      never stored permanently. We comply with GDPR and other privacy regulations.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-3">Can I download and edit the contracts I create?</h3>
                    <p className="text-muted-foreground">
                      Absolutely! All drafted contracts can be downloaded as PDF or DOCX files. You can then edit them in your preferred word processor
                      or share them with other parties as needed.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-3">Do you provide legal advice?</h3>
                    <p className="text-muted-foreground">
                      No, we are not a law firm and do not provide legal advice. Our AI helps draft and analyze contracts based on standard legal templates,
                      but you should always have contracts reviewed by qualified legal professionals before signing.
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* CTA Section */}
              <div className="text-center mt-16">
                <h3 className="text-2xl font-bold mb-4">Ready to get started?</h3>
                <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
                  Join thousands of professionals who trust Contract Coach for their legal document needs.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link to="/auth">
                    <Button size="lg" className="px-8 py-3">
                      Start Free Trial
                    </Button>
                  </Link>
                  <Button size="lg" variant="outline" className="px-8 py-3">
                    Schedule Demo
                  </Button>
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
