import { Link } from 'react-router-dom';
import {  Users, Building2, FileText, CheckCircle, ArrowRight, BarChart3, Lock, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function Home() {
  const features = [
    {
      icon: Building2,
      title: 'Multi-Insurance  Support',
      description: 'Manage multiple insurance forms from a single platform',
    },
    {
      icon: FileText,
      title: 'Dynamic Forms',
      description: 'Create custom questionnaires with various question types',
    },
    {
      icon: Users,
      title: 'Role-Based Access',
      description: 'Separate dashboards for admins, agents, and users',
    },
    {
      icon: BarChart3,
      title: 'Real-time Analytics',
      description: 'Track responses and monitor form submissions live',
    },
    {
      icon: Lock,
      title: 'Secure & Private',
      description: 'Enterprise-grade security for sensitive data',
    },
    {
      icon: Zap,
      title: 'Auto-Save',
      description: 'Never lose progress with automatic form saving',
    },
  ];

  const stats = [
    { value: '50+', label: 'Partner Insurance Providers' },
    { value: '10K+', label: 'Forms Submitted' },
    { value: '99.9%', label: 'Uptime' },
    { value: '24/7', label: 'Support' },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/10 py-20 lg:py-32">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMDVkOWUiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        
        <div className="container relative z-10">
          <div className="mx-auto max-w-4xl text-center">
            <div
  style={{
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
  }}
>
  <img
    src="/xcyber360-logo.png"
    alt="XCyber Logo"
    style={{
      objectFit: "contain",    // removes visual offset
      display: "block",
      margin: "0 auto",        // forces horizontal center
    }}
  />
</div>

            <div className="mb-6 inline-flex items-center rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            
              Trusted by Leading Insurance Providers
            </div>
            
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Streamline Your{' '}
              <span className="gradient-text">Insurance Forms</span>{' '}
              Collection
            </h1>
            
            <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground">
              XCyber is the modern platform for collecting, managing, and analyzing insurance form responses. 
              Built for insurance providers, agents, and customers who demand efficiency.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
  <Button
    asChild
    size="lg"
    className="rounded-full px-8 h-12 bg-white text-blue-600 hover:bg-white/90"
  >
    <Link to="/register">
      Create Free Account
      <ArrowRight className="ml-2 h-4 w-4" />
    </Link>
  </Button>

 <Button
  asChild
  variant="outline"
  size="lg"
  className="
    rounded-full px-8 h-12
    border-primary-foreground/20
    [&_a]:text-black
    [&_a:hover]:text-black
    hover:bg-primary-foreground/10
  "
>
  <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
    Sign In
  </Link>
</Button>

</div>

          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-accent/20 blur-3xl" />
      </section>

      {/* Stats Section */}
      <section className="border-y border-border bg-card py-12">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold gradient-text">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 lg:py-28">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Everything You Need</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A complete solution for insurance form management with powerful features for every role
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="group card-hover border-0 shadow-md">
                <CardContent className="p-6">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 lg:py-28 bg-muted/50">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Get started in minutes with our simple three-step process
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: '1', title: 'Register', description: 'Create your account as a user, agent, or admin' },
              { step: '2', title: 'Select Insurance', description: 'Choose your Insurance and access relevant forms' },
              { step: '3', title: 'Submit', description: 'Fill out forms with auto-save and submit when ready' },
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="mb-4 mx-auto h-16 w-16 rounded-full bg-primary flex items-center justify-center text-2xl font-bold text-primary-foreground">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-28">
        <div className="container">
          <Card className="bg-primary text-primary-foreground border-0 overflow-hidden relative">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />
            <CardContent className="p-8 md:p-12 text-center relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Get Started?</h2>
              <p className="text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
                Join thousands of insurance professionals who trust XCyber for their form management needs.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button asChild size="lg" variant="secondary" className="rounded-full px-8">
                  <Link to="/register">
                    Create Free Account
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-full px-8 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10">
                  <Link to="/login">Sign In</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
