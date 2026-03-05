import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { BurhanNewLogo } from "./BurhanNewLogo";
import { Upload, BarChart3, FileCheck, Sparkles, Activity, FileText, ArrowRight, Shield, User, Globe, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import heroBackground from "figma:asset/12215aafd42e6652da7545d3c96a489c909772f0.png";

interface LandingPageProps {
  onGetStarted: () => void;
}

const slides = [
  {
    title: "Smart Evidence Management",
    subtitle: "Upload & Organize",
    description: "Drag and drop compliance documents, policies, and certificates. Support for all major file formats with intelligent categorization.",
    gradient: "from-[#DBE64C]/20 via-[#74C365]/20 to-transparent",
  },
  {
    title: "AI-Powered Compliance Mapping",
    subtitle: "Automated Analysis",
    description: "Automatically link documents to specific NCA-ECC controls with AI precision and real-time compliance scoring.",
    gradient: "from-[#1E488F]/20 via-[#00804C]/20 to-transparent",
  },
  {
    title: "Intelligent Reporting",
    subtitle: "LLM-Generated Insights",
    description: "Generate comprehensive audit reports with AI-powered insights and executive summaries in seconds.",
    gradient: "from-[#001F3F]/20 via-[#DBE64C]/20 to-transparent",
  },
  {
    title: "Real-Time Dashboard",
    subtitle: "Live Compliance Metrics",
    description: "Monitor your compliance status across all domains with actionable insights and performance tracking at a glance.",
    gradient: "from-[#74C365]/20 via-[#1E488F]/20 to-transparent",
  },
];

const mockPieData = [
  { name: "Compliant", value: 79, color: "#10b981" },
  { name: "Partial", value: 13, color: "#f59e0b" },
  { name: "Gap", value: 8, color: "#ef4444" },
];

const mockBarData = [
  { name: "Access", value: 85 },
  { name: "Data", value: 72 },
  { name: "Network", value: 91 },
  { name: "Incident", value: 58 },
  { name: "Risk", value: 78 },
];

export function LandingPage({ onGetStarted }: LandingPageProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Transparent to Glass on Scroll */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/80 backdrop-blur-md border-b border-border/50 shadow-sm' 
          : 'bg-transparent border-b border-transparent'
      }`}>
        <div className="container mx-auto px-8 py-5">
          <div className="flex items-center justify-between">
            {/* Left Side - Logo */}
            <div className="flex items-center flex-1">
              <BurhanNewLogo size="lg" />
            </div>

            {/* Center - Navigation Menus */}
            <nav className="flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
              {/* Product Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger className="px-4 py-2 text-sm font-normal text-foreground/80 hover:text-foreground transition-colors flex items-center gap-1 bg-transparent border-0 cursor-pointer">
                  PRODUCT
                  <ChevronDown className="w-3 h-3" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-56 mt-2">
                  <DropdownMenuItem className="cursor-pointer">Features</DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">How it works</DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">Evidence Engine</DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">Compliance Scoring</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Resources Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger className="px-4 py-2 text-sm font-normal text-foreground/80 hover:text-foreground transition-colors flex items-center gap-1 bg-transparent border-0 cursor-pointer">
                  RESOURCES
                  <ChevronDown className="w-3 h-3" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-56 mt-2">
                  <DropdownMenuItem className="cursor-pointer">Documentation</DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">Case Studies</DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">Blog</DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">Support</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>

            {/* Right Side - Auth Buttons */}
            <div className="flex items-center gap-3 flex-1 justify-end">
              <button 
                onClick={onGetStarted}
                className="px-4 py-2 text-sm font-normal text-foreground/80 hover:text-foreground transition-colors"
              >
                LOG IN
              </button>
              
              <button 
                onClick={onGetStarted}
                className="px-5 py-2.5 text-sm font-normal bg-[#74C365] text-white hover:bg-[#74C365]/90 transition-colors rounded-none"
              >
                WATCH A DEMO
              </button>
            </div>
          </div>
        </div>
      </header>

   
      {/* Hero Carousel Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden pt-20">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${heroBackground})`,
          }}
        />
        
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-[#001F3F]/30" />

        {/* Carousel Content */}
        <div className="relative container mx-auto px-6 z-10">
          <div className={`max-w-4xl transition-all duration-700 bg-gradient-to-r ${slides[currentSlide].gradient} p-12 rounded-3xl`}>
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-sm">
                <Sparkles className="w-4 h-4 text-primary" />
                <span>{slides[currentSlide].subtitle}</span>
              </div>
              
              <h1 className="text-6xl md:text-7xl font-bold tracking-tight">
                {slides[currentSlide].title}
              </h1>
              
              <p className="text-xl text-muted-foreground max-w-2xl">
                {slides[currentSlide].description}
              </p>
              
              <div className="pt-4">
                <Button size="lg" onClick={onGetStarted} className="gap-2 bg-primary hover:bg-primary/90">
                  Get Started <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Carousel Indicators */}
          <div className="flex items-center justify-center gap-2 mt-12">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentSlide ? 'w-8 bg-primary' : 'w-2 bg-muted-foreground/30'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={prevSlide}
          className="absolute left-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-background/80 hover:bg-background border shadow-lg flex items-center justify-center transition-all z-20"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        
        <button
          onClick={nextSlide}
          className="absolute right-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-background/80 hover:bg-background border shadow-lg flex items-center justify-center transition-all z-20"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-4xl font-bold">Ready to Transform Your Compliance?</h2>
            <p className="text-xl opacity-90">
              Join leading organizations using بُرهان to streamline their NCA-ECC compliance
            </p>
            <Button size="lg" variant="secondary" onClick={onGetStarted} className="gap-2">
              Start Free Trial <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-16 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            {/* Logo Section */}
            <div className="flex flex-col items-start gap-4">
              <BurhanNewLogo size="md" />
              <p className="text-sm text-muted-foreground max-w-xs">
                Transform your NCA-ECC compliance with AI-powered evidence management and intelligent reporting.
              </p>
            </div>

            {/* Links Section 1 */}
            <div className="flex flex-col gap-4">
              <h4 className="font-semibold text-foreground">Company</h4>
              <nav className="flex flex-col gap-3 text-sm text-muted-foreground">
                <a href="#about" className="hover:text-foreground transition-colors">About BURHAN</a>
                <a href="#faqs" className="hover:text-foreground transition-colors">FAQs</a>
                <a href="#contact" className="hover:text-foreground transition-colors">Contact Us</a>
              </nav>
            </div>

            {/* Links Section 2 */}
            <div className="flex flex-col gap-4">
              <h4 className="font-semibold text-foreground">Legal</h4>
              <nav className="flex flex-col gap-3 text-sm text-muted-foreground">
                <a href="#privacy" className="hover:text-foreground transition-colors">Privacy Policy</a>
                <a href="#terms" className="hover:text-foreground transition-colors">Terms of Use</a>
                <a href="#cookies" className="hover:text-foreground transition-colors">Cookies Policy</a>
              </nav>
            </div>
          </div>

          {/* Copyright */}
          <div className="pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground text-center">
              © Burhan 2025. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}