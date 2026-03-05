import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { Search, FileText, MessageCircle, Mail, Phone, ExternalLink, Book, Video } from "lucide-react";

const faqs = [
  {
    question: "How do I upload evidence for compliance controls?",
    answer: "Navigate to the Evidence Management tab and use the drag-and-drop interface to upload files. The system will automatically map your evidence to relevant NCA-ECC controls based on the domain and tags you provide.",
  },
  {
    question: "What file formats are supported for evidence uploads?",
    answer: "The system supports PDF, DOC, DOCX, XLS, XLSX, PNG, JPG, and ZIP file formats. Maximum file size is 50MB per upload.",
  },
  {
    question: "How is the compliance percentage calculated?",
    answer: "The compliance percentage is calculated based on the number of fully compliant controls divided by the total number of applicable controls for your organization. Partially compliant controls are weighted at 50%.",
  },
  {
    question: "Can I export compliance reports in different formats?",
    answer: "Yes, you can generate reports in PDF, Word, Excel, and HTML formats. Go to the Compliance Report Generator tab to configure and download reports.",
  },
  {
    question: "How do I add new users to my organization?",
    answer: "Navigate to User Profile & Organization Settings, then click 'Invite User' in the Access Management section. You can assign roles such as Admin, Auditor, Assessor, or Viewer.",
  },
  {
    question: "What is the difference between Compliant, Partial, and Non-Compliant statuses?",
    answer: "Compliant means all requirements are met with adequate evidence. Partial indicates some requirements are met but additional evidence is needed. Non-Compliant means requirements are not met or evidence is missing.",
  },
  {
    question: "How often should I update compliance evidence?",
    answer: "It's recommended to review and update evidence quarterly, or whenever there are significant changes to your security controls. Some controls may require more frequent updates based on NCA requirements.",
  },
  {
    question: "Can I customize the control domains for my organization?",
    answer: "The NCA-ECC framework domains are standardized. However, you can filter and focus on specific domains relevant to your organization in the Control Mapping View.",
  },
];

const resources = [
  {
    title: "Getting Started Guide",
    description: "Complete walkthrough for new users",
    icon: Book,
    link: "#",
  },
  {
    title: "NCA-ECC Framework Documentation",
    description: "Official framework guidelines",
    icon: FileText,
    link: "#",
  },
  {
    title: "Video Tutorials",
    description: "Step-by-step video guides",
    icon: Video,
    link: "#",
  },
  {
    title: "Best Practices",
    description: "Compliance best practices and tips",
    icon: FileText,
    link: "#",
  },
];

export function HelpSupport() {
  return (
    <div className="space-y-6">
      <div>
        <h2>Help & Support</h2>
        <p className="text-muted-foreground">
          Documentation, resources, and assistance
        </p>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search for help articles, guides, and documentation..."
              className="pl-12 h-12"
            />
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {resources.map((resource, index) => (
          <Card key={index} className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <resource.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h4>{resource.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {resource.description}
                  </p>
                </div>
                <Button variant="ghost" size="sm" className="gap-2">
                  Open <ExternalLink className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* FAQs */}
      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
          <CardDescription>
            Common questions about using the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`faq-${index}`}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground">{faq.answer}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Contact Support */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Support</CardTitle>
          <CardDescription>
            Get in touch with our support team
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 border rounded-lg text-center space-y-3">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                <MessageCircle className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h4>Live Chat</h4>
                <p className="text-sm text-muted-foreground">
                  Available 24/7
                </p>
              </div>
              <Button variant="outline" className="w-full">
                Start Chat
              </Button>
            </div>

            <div className="p-4 border rounded-lg text-center space-y-3">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h4>Email Support</h4>
                <p className="text-sm text-muted-foreground">
                  support@burhan.sa
                </p>
              </div>
              <Button variant="outline" className="w-full">
                Send Email
              </Button>
            </div>

            <div className="p-4 border rounded-lg text-center space-y-3">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                <Phone className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h4>Phone Support</h4>
                <p className="text-sm text-muted-foreground">
                  +966 11 XXX XXXX
                </p>
              </div>
              <Button variant="outline" className="w-full">
                Call Now
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Version</p>
              <p><span className="arabic-text">بُرهان</span> v2.1.0</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Last Updated</p>
              <p>October 15, 2025</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">NCA-ECC Framework</p>
              <p>Version 3.0 (2025)</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">License</p>
              <p>Enterprise License</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
