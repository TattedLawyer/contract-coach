import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { TrainingContractUpload } from "@/components/TrainingContractUpload";
import { ContractAnalysis } from "@/components/ContractAnalysis";
import { TrainingDataAnalysis } from "@/components/TrainingDataAnalysis";
import { useUserRole } from "@/hooks/useUserRole";
import { FileText, Upload, Shield, FileCheck, Star, Calendar, Play, Settings } from "lucide-react";

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
        <header className="absolute top-0 left-0 w-full p-4 md:p-6 z-10">
          <nav className="container mx-auto flex justify-between items-center">

            {/* ===== LOGO (LEFT SIDE) ===== */}
            <div>
              <a href="/" aria-label="EZ Biz Contract Home">
                <img
                  src="/Andrometa Brand Kit.svg"
                  alt="EZ Biz Contract Logo"
                  className="h-10 w-auto md:h-12"
                />
              </a>
            </div>

            {/* ===== NAVIGATION LINKS (RIGHT SIDE) ===== */}
            <div className="flex items-center space-x-4">
              <Link to="/auth">
                <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                  Log in
                </Button>
              </Link>
              <Link to="/auth">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                  Analyze Contract
                </Button>
              </Link>
            </div>

          </nav>
        </header>

        {/* Trust indicators */}
        <div className="border-b border-border/40 bg-background/50">
          <div className="container mx-auto px-2 py-3">
            <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Enterprise-grade security
              </div>
              <div className="w-px h-4 bg-border"></div>
              <div>AI trained on 1000+ real contracts</div>
              <div className="w-px h-4 bg-border"></div>
              <div>Make it EZ guarantee</div>
              <div className="w-px h-4 bg-border"></div>
              <div>24/7 support</div>
            </div>
          </div>
        </div>

        {/* Hero Section - Contract Drafting/Analysis */}
        <div className="container mx-auto px-2 pt-12 pb-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Column 1: Text Content (centered) */}
            <div className="text-center space-y-6">
              <div className="space-y-4">
                <h1 className="text-4xl lg:text-6xl font-bold leading-tight tracking-tight">
                  <span className="block text-foreground">Draft & Analyze</span>
                  <span className="block bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
                    Contracts Smarter
                  </span>
                </h1>

                <p className="text-lg lg:text-xl text-muted-foreground leading-relaxed">
                  AI trained on hundreds of real contracts to make professional contract management EZ. Choose your path below.
                </p>

                {/* Tagline */}
                <div className="py-3 text-center">
                  <p className="text-xl lg:text-2xl font-semibold bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
                    Make Biz EZ ✨
                  </p>
                </div>
              </div>

              {/* Contract Options */}
              <div className="grid md:grid-cols-2 gap-3 mt-8">
                <Link to="/auth" className="block">
                  <Card className="h-full hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/50 cursor-pointer group">
                    <CardContent className="p-8 text-center space-y-4">
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto group-hover:bg-primary/20 transition-colors">
                        <FileText className="h-8 w-8 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold mb-2">Draft Contract</h3>
                        <p className="text-muted-foreground mb-4">
                          Create professional contracts EZ with our AI-powered wizard. Trained on hundreds of real contracts for maximum accuracy.
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
                          Upload contracts for instant AI analysis. Trained on 1000+ real contracts to make compliance EZ and accurate.
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
                $19.99 per contract draft (3 revisions included) • $39.99 unlimited • Free contract grade analysis
              </p>
            </div>

            {/* Column 2: Hero Image */}
            <div className="hidden lg:block">
              <div className="relative">
                <img
                  src="/HERO IMAGE 2.svg"
                  alt="Professional contract creator working with AI-powered tools"
                  className="rounded-lg shadow-xl w-full h-auto object-cover"
                  onError={(e) => {
                    // Fallback to a placeholder div if image fails to load
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.parentElement?.querySelector('.hero-fallback');
                    if (fallback) {
                      (fallback as HTMLElement).style.display = 'block';
                    }
                  }}
                />
                <div className="hero-fallback hidden rounded-lg shadow-xl w-full aspect-[4/3] bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                  <div className="text-center p-8">
                    <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText className="h-10 w-10 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">Hero Image</h3>
                    <p className="text-sm text-muted-foreground">Coming Soon</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section - Industry-Leading Contract Tools */}
        <div className="py-12">
          <div className="container mx-auto px-2">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                Industry-Leading Contract Intelligence
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Everything you need for professional contract management, included in every plan.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 items-center mb-12">
              {/* Feature Cards */}
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 flex-shrink-0">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Risk Detection & Compliance</h3>
                    <p className="text-muted-foreground">
                      AI trained on hundreds of real contracts automatically identifies risks, compliance issues, and unfavorable terms - making due diligence EZ.
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
                      Get comprehensive analysis in seconds with AI trained on 1000+ real contracts. Extract terms, obligations, and deadlines EZ.
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
                      Create professionally sound contracts EZ with our AI-guided wizard. Choose from service agreements, NDAs, employment contracts, and more.
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
                      Get Started
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-muted/30 py-12">
          <div className="container mx-auto px-2">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
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
                      Simply sign up and choose "Draft Contract" from the main dashboard, and follow EzBiz's guided wizard.
                      Select your contract type, answer a few questions about the parties and terms, and EzBiz will generate a professional contract for you.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-3">What types of contracts can you help me create?</h3>
                    <p className="text-muted-foreground">
                      EzBiz supports service agreements, independent contractor agreements, consulting agreements, employment contracts,
                      partnership agreements, license agreements, and non-disclosure agreements. For other contract types, you can use EzBiz's custom drafting option.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-3">How does contract analysis work?</h3>
                    <p className="text-muted-foreground">
                      Upload your existing contract (PDF, DOC, or DOCX format up to 25MB), and EzBiz's AI will analyze it for risks, compliance issues,
                      key terms, and provide a detailed grade and improvement suggestions. Analysis typically takes just a few seconds.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-3">Is my data secure?</h3>
                    <p className="text-muted-foreground">
                      Yes, EzBiz uses enterprise-grade security with end-to-end encryption. Your contracts are processed securely and
                      never stored permanently. EzBiz complies with GDPR and other privacy regulations.
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
                      No, EzBiz is not a law firm and does not provide legal advice. EzBiz's AI helps draft and analyze contracts based on standard legal templates,
                      but you should always have contracts reviewed by qualified legal professionals before signing.
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* CTA Section */}
              <div className="text-center mt-16">
                <h3 className="text-2xl font-bold mb-4">Ready to get started?</h3>
                <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
                  Join thousands of professionals who trust EzBiz for their legal document needs.
                </p>
                <div className="flex justify-center">
                  <Link to="/auth">
                    <Button size="lg" className="px-8 py-3">
                      Get Started
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-3">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <header className="w-full p-4 md:p-6 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <nav className="container mx-auto flex justify-between items-center">

            {/* ===== LOGO (LEFT SIDE) ===== */}
            <div>
              <a href="/" aria-label="EZ Biz Contract Home">
                <img
                  src="/Andrometa Brand Kit.svg"
                  alt="EZ Biz Contract Logo"
                  className="h-10 w-auto md:h-12"
                />
              </a>
            </div>

            {/* ===== WELCOME TEXT AND SETTINGS (RIGHT SIDE) ===== */}
            <div className="flex items-center gap-2">
              {/* Welcome text and user info */}
              <div className="text-right">
                <h1 className="text-2xl font-bold">Welcome back</h1>
                <p className="text-muted-foreground text-sm">{user.email}</p>
              </div>

              {/* Settings button with Sign Out */}
              <div className="flex gap-1">
                {user.email === 'tatted@mnnt.io' && (
                  <Button
                    onClick={handleAssignAdmin}
                    disabled={assigningAdmin}
                    variant="secondary"
                    size="sm"
                  >
                    {assigningAdmin ? 'Assigning...' : 'Assign Admin'}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    // For now, just sign out when settings is clicked
                    // You can expand this to show a dropdown menu later
                    signOut();
                  }}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </div>
            </div>

          </nav>
        </header>

        {/* Admin Panel */}
        {isAdmin && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Admin Panel</h2>
            <TrainingContractUpload />
            <TrainingDataAnalysis />
          </div>
        )}

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-4">
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

          <div className="space-y-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
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
