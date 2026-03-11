"use client";

import { useState } from "react";
import MarketingLayout from "@/components/layout/marketing-layout";
import {
  Check,
  ChevronDown,
  Zap,
  Shield,
  BarChart3,
  HeadphonesIcon,
  Building2,
  ArrowRight,
} from "lucide-react";

const tiers = [
  {
    name: "Starter",
    description: "Perfect for small campaigns and ballot initiatives.",
    monthlyPrice: "$0.10",
    annualPrice: "$0.08",
    priceUnit: "/signature",
    setupFee: "$199 setup fee",
    highlighted: false,
    cta: "Start Free Trial",
    features: [
      "AI-powered OCR scanning",
      "Voter file matching",
      "Basic dashboard & reporting",
      "Email support",
      "Up to 5 active projects",
      "CSV & PDF exports",
      "Standard processing speed",
    ],
  },
  {
    name: "Professional",
    description: "For serious campaigns that need full-service verification.",
    monthlyPrice: "$0.30",
    annualPrice: "$0.24",
    priceUnit: "/signature",
    setupFee: "$399 setup fee",
    highlighted: true,
    badge: "Most Popular",
    cta: "Start Free Trial",
    features: [
      "Everything in Starter",
      "Full-service verification",
      "Compliance-ready reports",
      "Real-time analytics dashboard",
      "Priority support (4hr SLA)",
      "Unlimited active projects",
      "Duplicate detection",
      "Batch processing",
      "API access",
    ],
  },
  {
    name: "Enterprise",
    description: "Custom solutions for large-scale petition operations.",
    monthlyPrice: "Custom",
    annualPrice: "Custom",
    priceUnit: "",
    setupFee: "Custom onboarding",
    highlighted: false,
    cta: "Contact Sales",
    features: [
      "Everything in Professional",
      "Custom integrations",
      "Guaranteed SLA (99.9% uptime)",
      "Dedicated account manager",
      "On-premise deployment option",
      "Bulk volume discounts",
      "White-label option",
      "Custom compliance workflows",
      "SSO & advanced security",
    ],
  },
];

const comparisonFeatures = [
  { name: "AI OCR Scanning", starter: true, pro: true, enterprise: true },
  { name: "Voter File Matching", starter: true, pro: true, enterprise: true },
  { name: "Dashboard & Reporting", starter: "Basic", pro: "Advanced", enterprise: "Custom" },
  { name: "Active Projects", starter: "5", pro: "Unlimited", enterprise: "Unlimited" },
  { name: "Full-Service Verification", starter: false, pro: true, enterprise: true },
  { name: "Compliance Reports", starter: false, pro: true, enterprise: true },
  { name: "Real-Time Analytics", starter: false, pro: true, enterprise: true },
  { name: "API Access", starter: false, pro: true, enterprise: true },
  { name: "Duplicate Detection", starter: false, pro: true, enterprise: true },
  { name: "Support", starter: "Email", pro: "Priority (4hr)", enterprise: "Dedicated Manager" },
  { name: "Custom Integrations", starter: false, pro: false, enterprise: true },
  { name: "SLA Guarantee", starter: false, pro: false, enterprise: "99.9%" },
  { name: "On-Premise Deployment", starter: false, pro: false, enterprise: true },
  { name: "White Label", starter: false, pro: false, enterprise: true },
  { name: "SSO", starter: false, pro: false, enterprise: true },
];

const faqs = [
  {
    question: "What counts as a signature?",
    answer:
      "A signature is any individual petition entry that goes through our verification pipeline. This includes the OCR scan, data extraction, and voter file matching. Duplicate entries that are flagged still count as processed signatures, since they require the same computational resources to identify.",
  },
  {
    question: "How does voter file matching work?",
    answer:
      "Our system cross-references extracted signer information (name, address, date of birth) against official state voter registration files. We use fuzzy matching algorithms to account for minor discrepancies like typos or abbreviations, and assign a confidence score to each match. You can configure the confidence threshold based on your jurisdiction's requirements.",
  },
  {
    question: "Can I switch plans?",
    answer:
      "Yes, you can upgrade or downgrade your plan at any time. When upgrading, the new per-signature rate takes effect immediately for all future signatures. When downgrading, the change takes effect at the start of your next billing cycle. Setup fees are one-time and non-refundable.",
  },
  {
    question: "What file formats do you support?",
    answer:
      "We support all common petition scan formats: PDF, JPEG, PNG, TIFF, and HEIC. You can upload individual pages or multi-page documents. Our OCR engine handles various print qualities, including handwritten signatures, and works with both standard and custom petition sheet layouts.",
  },
  {
    question: "How accurate is the AI matching?",
    answer:
      "Our AI matching engine achieves 97.5%+ accuracy on standard petition sheets. Accuracy can vary based on scan quality, handwriting legibility, and voter file completeness. Every automated match includes a confidence score, and our Professional and Enterprise plans include manual review workflows for low-confidence matches.",
  },
];

function FeatureCell({ value }: { value: boolean | string }) {
  if (typeof value === "string") {
    return <span className="text-sm text-gray-700">{value}</span>;
  }
  return value ? (
    <Check className="h-5 w-5 text-indigo-600 mx-auto" />
  ) : (
    <span className="text-gray-300 text-sm">—</span>
  );
}

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="hero-gradient py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900">
            Simple, Transparent{" "}
            <span className="gradient-text">Pricing</span>
          </h1>
          <p className="mt-5 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            Pay per signature with no hidden fees. Choose the plan that fits
            your campaign and scale as you grow.
          </p>

          {/* Billing Toggle */}
          <div className="mt-10 flex items-center justify-center gap-4">
            <span
              className={`text-sm font-medium ${!annual ? "text-gray-900" : "text-gray-500"}`}
            >
              Monthly
            </span>
            <button
              onClick={() => setAnnual(!annual)}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                annual ? "bg-indigo-600" : "bg-gray-300"
              }`}
              aria-label="Toggle annual billing"
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                  annual ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
            <span
              className={`text-sm font-medium ${annual ? "text-gray-900" : "text-gray-500"}`}
            >
              Annual
            </span>
            {annual && (
              <span className="ml-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                Save 20%
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="relative -mt-8 pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-3">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`relative flex flex-col rounded-2xl bg-white p-8 shadow-sm transition-shadow hover:shadow-lg ${
                  tier.highlighted
                    ? "border-2 border-indigo-600 ring-1 ring-indigo-600/20"
                    : "border border-gray-200"
                }`}
              >
                {tier.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-indigo-600 px-4 py-1 text-xs font-semibold text-white shadow-sm">
                      {tier.badge}
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-xl font-bold text-gray-900">
                    {tier.name}
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    {tier.description}
                  </p>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-gray-900">
                      {annual ? tier.annualPrice : tier.monthlyPrice}
                    </span>
                    {tier.priceUnit && (
                      <span className="text-sm text-gray-500">
                        {tier.priceUnit}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-400">{tier.setupFee}</p>
                </div>

                <a
                  href="#"
                  className={`mb-8 flex h-11 items-center justify-center rounded-lg text-sm font-semibold transition-colors ${
                    tier.highlighted
                      ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
                      : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {tier.cta}
                </a>

                <ul className="flex-1 space-y-3">
                  {tier.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-3 text-sm text-gray-600"
                    >
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold text-gray-900">
            Feature Comparison
          </h2>
          <p className="mt-3 text-center text-gray-500">
            A detailed look at what each plan includes.
          </p>

          <div className="mt-12 overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="pb-4 pr-6 text-sm font-semibold text-gray-900 w-1/3">
                    Feature
                  </th>
                  <th className="pb-4 px-4 text-center text-sm font-semibold text-gray-900 w-1/5">
                    Starter
                  </th>
                  <th className="pb-4 px-4 text-center text-sm font-semibold text-indigo-600 w-1/5">
                    Professional
                  </th>
                  <th className="pb-4 pl-4 text-center text-sm font-semibold text-gray-900 w-1/5">
                    Enterprise
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((feature, index) => (
                  <tr
                    key={feature.name}
                    className={
                      index % 2 === 0
                        ? "bg-white"
                        : "bg-gray-50"
                    }
                  >
                    <td className="py-3.5 pr-6 text-sm text-gray-700">
                      {feature.name}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <FeatureCell value={feature.starter} />
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <FeatureCell value={feature.pro} />
                    </td>
                    <td className="py-3.5 pl-4 text-center">
                      <FeatureCell value={feature.enterprise} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold text-gray-900">
            Frequently Asked Questions
          </h2>
          <p className="mt-3 text-center text-gray-500">
            Everything you need to know about our pricing and platform.
          </p>

          <div className="mt-12 space-y-3">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="rounded-xl border border-gray-200 bg-white"
              >
                <button
                  onClick={() =>
                    setOpenFaq(openFaq === index ? null : index)
                  }
                  className="flex w-full items-center justify-between px-6 py-4 text-left"
                >
                  <span className="text-sm font-semibold text-gray-900">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-gray-400 transition-transform ${
                      openFaq === index ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-5">
                    <p className="text-sm leading-relaxed text-gray-600">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-indigo-600 py-16">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-3xl font-bold text-white">
            Ready to streamline your petition verification?
          </h2>
          <p className="mt-4 text-lg text-indigo-100">
            Start your free trial today. No credit card required.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a
              href="#"
              className="inline-flex h-12 items-center gap-2 rounded-lg bg-white px-6 text-sm font-semibold text-indigo-600 shadow-sm hover:bg-indigo-50 transition-colors"
            >
              Get Started Free
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="#"
              className="inline-flex h-12 items-center gap-2 rounded-lg border border-indigo-400 px-6 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
            >
              Contact Sales
            </a>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
