"use client";

import MarketingLayout from "@/components/layout/marketing-layout";
import {
  Zap,
  Target,
  Eye,
  Users,
  Mail,
  Linkedin,
  Twitter,
  Github,
  ArrowRight,
  User,
} from "lucide-react";

const values = [
  {
    icon: Zap,
    title: "Speed",
    description:
      "Campaigns run on tight deadlines. Our AI processes thousands of signatures in minutes, not weeks, so you never miss a filing deadline.",
    color: "bg-amber-50 text-amber-600",
  },
  {
    icon: Target,
    title: "Accuracy",
    description:
      "Every signature matters. Our verification engine achieves 97.5%+ accuracy with multi-layered matching against official voter files.",
    color: "bg-indigo-50 text-indigo-600",
  },
  {
    icon: Eye,
    title: "Transparency",
    description:
      "You deserve to know exactly how your money is spent and how results are calculated. Our pricing is simple and our reports are fully auditable.",
    color: "bg-cyan-50 text-cyan-600",
  },
  {
    icon: Users,
    title: "Accessibility",
    description:
      "Petition verification should not be a luxury. Our Starter plan makes professional-grade verification available to campaigns of every size and budget.",
    color: "bg-green-50 text-green-600",
  },
];

const team = [
  {
    name: "Sarah Chen",
    role: "CEO & Co-Founder",
    bio: "Former campaign manager with 12 years in political operations. Led ballot initiative efforts across 8 states.",
  },
  {
    name: "Marcus Rivera",
    role: "CTO & Co-Founder",
    bio: "ML engineer and civic tech advocate. Previously built document processing systems at a Fortune 500 company.",
  },
  {
    name: "Aisha Patel",
    role: "Head of Product",
    bio: "Product leader specializing in government and compliance tools. Passionate about making democracy more accessible.",
  },
];

export default function AboutPage() {
  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="hero-gradient py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900">
            Built by campaigners,{" "}
            <span className="gradient-text">for campaigners</span>
          </h1>
          <p className="mt-5 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            We have been on the ground collecting signatures, racing against
            deadlines, and dealing with manual verification nightmares. We built
            PetitionPilot to fix that.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-white border border-gray-200 p-8 sm:p-12 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900">Our Mission</h2>
            <div className="mt-6 space-y-4 text-gray-600 leading-relaxed">
              <p>
                Petition signature verification is a critical part of direct
                democracy, yet it remains one of the most tedious and
                error-prone processes in campaign operations. Campaigns spend
                thousands of hours and dollars manually checking signatures
                against voter rolls, often under extreme time pressure.
              </p>
              <p>
                PetitionPilot exists to make petition verification fast,
                accurate, and affordable. We combine cutting-edge AI with deep
                election-law expertise to give every campaign -- from
                neighborhood ballot initiatives to statewide referendums -- the
                tools they need to succeed.
              </p>
              <p>
                We believe that when the tools of democracy are accessible to
                everyone, democracy works better for everyone.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Our Values</h2>
            <p className="mt-3 text-gray-500 max-w-xl mx-auto">
              These principles guide every decision we make, from product
              design to pricing.
            </p>
          </div>

          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value) => (
              <div
                key={value.title}
                className="rounded-2xl bg-white border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div
                  className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${value.color}`}
                >
                  <value.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">
                  {value.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Meet the Team</h2>
            <p className="mt-3 text-gray-500 max-w-xl mx-auto">
              A small team with big experience in campaigns, technology, and
              civic infrastructure.
            </p>
          </div>

          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {team.map((member) => (
              <div
                key={member.name}
                className="rounded-2xl bg-white border border-gray-200 p-6 shadow-sm text-center hover:shadow-md transition-shadow"
              >
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gray-100">
                  <User className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-gray-900">
                  {member.name}
                </h3>
                <p className="mt-1 text-sm font-medium text-indigo-600">
                  {member.role}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-gray-500">
                  {member.bio}
                </p>
                <div className="mt-4 flex items-center justify-center gap-3">
                  <a
                    href="#"
                    className="text-gray-400 hover:text-indigo-600 transition-colors"
                    aria-label={`${member.name} on LinkedIn`}
                  >
                    <Linkedin className="h-4 w-4" />
                  </a>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-indigo-600 transition-colors"
                    aria-label={`${member.name} on Twitter`}
                  >
                    <Twitter className="h-4 w-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900">Get in Touch</h2>
          <p className="mt-3 text-gray-500">
            Have questions about PetitionPilot? We would love to hear from you.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a
              href="mailto:hello@petitionpilot.com"
              className="inline-flex h-12 items-center gap-2.5 rounded-xl bg-white border border-gray-200 px-6 text-sm font-medium text-gray-700 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all"
            >
              <Mail className="h-5 w-5 text-indigo-600" />
              hello@petitionpilot.com
            </a>
          </div>

          <div className="mt-8 flex items-center justify-center gap-5">
            <a
              href="#"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white border border-gray-200 text-gray-500 shadow-sm hover:text-indigo-600 hover:border-indigo-300 transition-all"
              aria-label="Twitter"
            >
              <Twitter className="h-4 w-4" />
            </a>
            <a
              href="#"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white border border-gray-200 text-gray-500 shadow-sm hover:text-indigo-600 hover:border-indigo-300 transition-all"
              aria-label="LinkedIn"
            >
              <Linkedin className="h-4 w-4" />
            </a>
            <a
              href="#"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white border border-gray-200 text-gray-500 shadow-sm hover:text-indigo-600 hover:border-indigo-300 transition-all"
              aria-label="GitHub"
            >
              <Github className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-indigo-600 py-16">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-3xl font-bold text-white">
            Ready to modernize your petition workflow?
          </h2>
          <p className="mt-4 text-lg text-indigo-100">
            Join hundreds of campaigns already using PetitionPilot.
          </p>
          <div className="mt-8">
            <a
              href="/pricing"
              className="inline-flex h-12 items-center gap-2 rounded-lg bg-white px-6 text-sm font-semibold text-indigo-600 shadow-sm hover:bg-indigo-50 transition-colors"
            >
              View Pricing
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
