"use client";

import { useState } from "react";
import MarketingLayout from "@/components/layout/marketing-layout";
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  Send,
  ChevronRight,
  HelpCircle,
} from "lucide-react";

const contactInfo = [
  {
    icon: Mail,
    label: "Email",
    value: "hello@petitionpilot.com",
    href: "mailto:hello@petitionpilot.com",
  },
  {
    icon: Phone,
    label: "Phone",
    value: "(202) 555-0142",
    href: "tel:+12025550142",
  },
  {
    icon: MapPin,
    label: "Office",
    value: "1455 Pennsylvania Ave NW, Suite 400, Washington, DC 20004",
    href: "#",
  },
];

const faqLinks = [
  { question: "How does signature verification work?", href: "#" },
  { question: "What file formats do you support?", href: "#" },
  { question: "How accurate is the AI matching?", href: "#" },
  { question: "Can I integrate with my voter database?", href: "#" },
];

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [organization, setOrganization] = useState("");
  const [message, setMessage] = useState("");
  const [plan, setPlan] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Stub: would submit to API
    alert("Message sent! We'll be in touch soon.");
    setName("");
    setEmail("");
    setOrganization("");
    setMessage("");
    setPlan("");
  };

  return (
    <MarketingLayout>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
            Get in <span className="gradient-text">Touch</span>
          </h1>
          <p className="mt-4 text-lg text-gray-500">
            Have questions about PetitionPilot? We&apos;d love to hear from you.
            Our team typically responds within 24 hours.
          </p>
        </div>

        {/* Two columns */}
        <div className="grid gap-12 lg:grid-cols-2">
          {/* Left - Contact form */}
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Send us a message
            </h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  required
                  className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@organization.com"
                  required
                  className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Organization
                </label>
                <input
                  type="text"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder="Your organization"
                  className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Plan interest
                </label>
                <select
                  value={plan}
                  onChange={(e) => setPlan(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                >
                  <option value="">Select a plan...</option>
                  <option value="starter">Starter</option>
                  <option value="professional">Professional</option>
                  <option value="enterprise">Enterprise</option>
                  <option value="unsure">Not sure yet</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  placeholder="Tell us about your campaign and how we can help..."
                  required
                  className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none"
                />
              </div>
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all"
              >
                <Send className="h-4 w-4" />
                Send Message
              </button>
            </form>
          </div>

          {/* Right - Contact info + demo */}
          <div className="space-y-6">
            {/* Contact info cards */}
            {contactInfo.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.label}
                  href={item.href}
                  className="flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50">
                    <Icon className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {item.label}
                    </p>
                    <p className="mt-0.5 text-sm text-gray-500">
                      {item.value}
                    </p>
                  </div>
                </a>
              );
            })}

            {/* Book a Demo card */}
            <a
              href="#"
              className="flex items-center gap-4 rounded-xl border-2 border-indigo-100 bg-indigo-50/50 p-6 hover:border-indigo-200 transition-all group"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-600 group-hover:bg-indigo-700 transition-colors">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-base font-semibold text-gray-900">
                  Book a Demo
                </p>
                <p className="mt-0.5 text-sm text-gray-500">
                  See PetitionPilot in action with a personalized walkthrough
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-indigo-400 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>
        </div>

        {/* FAQ Quick Links */}
        <div className="mt-20">
          <div className="flex items-center gap-2 mb-6">
            <HelpCircle className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Frequently Asked Questions
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {faqLinks.map((faq) => (
              <a
                key={faq.question}
                href={faq.href}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-5 py-3.5 text-sm font-medium text-gray-700 hover:border-indigo-200 hover:text-indigo-600 transition-all group"
              >
                {faq.question}
                <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}
