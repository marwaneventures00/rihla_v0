import {
  Briefcase,
  Building2,
  TrendingUp,
  Banknote,
  Cpu,
  Stethoscope,
  Wheat,
  Truck,
  Megaphone,
  Lightbulb,
  Landmark,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type Outlook = "Hot" | "Stable" | "Declining";
export type Sector = {
  name: string;
  icon: LucideIcon;
  outlook: Outlook;
  description: string;
};

export const SECTORS: Sector[] = [
  { name: "Finance & Banking", icon: Banknote, outlook: "Stable", description: "Casablanca remains North Africa's largest financial hub. Major retail and corporate banks continue steady graduate intake." },
  { name: "Consulting", icon: Briefcase, outlook: "Hot", description: "Big-4 and strategy firms are aggressively expanding their Casablanca offices to serve African clients." },
  { name: "Tech & Digital", icon: Cpu, outlook: "Hot", description: "Fast-growing local payment, SaaS and AI players plus offshoring centers driving 20%+ annual hiring growth." },
  { name: "Energy & Industry", icon: Zap, outlook: "Stable", description: "OCP Group ecosystem, renewables and automotive (Renault, Stellantis) anchor industrial employment." },
  { name: "Public Sector", icon: Landmark, outlook: "Stable", description: "Reform-driven recruitment in ministries, regulators and public institutions, plus competitive concours." },
  { name: "Healthcare", icon: Stethoscope, outlook: "Hot", description: "Private clinic groups and pharma distributors expand alongside national health-coverage rollout." },
  { name: "Agribusiness", icon: Wheat, outlook: "Stable", description: "Cooperatives, agro-exporters and food processors recruit engineers, agronomists and supply specialists." },
  { name: "Logistics", icon: Truck, outlook: "Hot", description: "Tanger Med port and free-zone expansion fuel demand in supply-chain, freight and last-mile operations." },
  { name: "Marketing & Media", icon: Megaphone, outlook: "Stable", description: "Agencies and in-house brand teams hire content, performance and brand profiles, especially digital natives." },
  { name: "Entrepreneurship", icon: Lightbulb, outlook: "Hot", description: "Startup ecosystem accelerated by 212Founders, UM6P Ventures and a maturing local VC scene." },
  { name: "Real Estate & Construction", icon: Building2, outlook: "Stable", description: "Large infrastructure programs, social housing and mixed-use developments support steady hiring." },
  { name: "Tourism & Hospitality", icon: TrendingUp, outlook: "Hot", description: "Post-pandemic rebound and 2030 World Cup preparations drive massive operational and management hiring." },
];

export type Role = {
  title: string;
  sector: string;
  level: "Entry" | "Mid" | "Senior";
  salaryMin: number;
  salaryMax: number;
  skills: string[];
};

export const ROLES: Role[] = [
  { title: "Financial Analyst", sector: "Finance & Banking", level: "Entry", salaryMin: 8000, salaryMax: 12000, skills: ["Excel", "Financial modeling", "IFRS basics"] },
  { title: "Investment Banking Analyst", sector: "Finance & Banking", level: "Entry", salaryMin: 12000, salaryMax: 18000, skills: ["DCF", "M&A research", "Pitch decks"] },
  { title: "Risk Officer", sector: "Finance & Banking", level: "Mid", salaryMin: 18000, salaryMax: 28000, skills: ["Basel III", "Credit risk", "SQL"] },
  { title: "Branch Manager", sector: "Finance & Banking", level: "Senior", salaryMin: 25000, salaryMax: 40000, skills: ["Sales leadership", "Compliance", "Coaching"] },
  { title: "Management Consultant", sector: "Consulting", level: "Entry", salaryMin: 14000, salaryMax: 22000, skills: ["Structured thinking", "PowerPoint", "Client interviews"] },
  { title: "Strategy Manager", sector: "Consulting", level: "Senior", salaryMin: 35000, salaryMax: 60000, skills: ["Project leadership", "BD", "Industry expertise"] },
  { title: "Audit Associate", sector: "Consulting", level: "Entry", salaryMin: 9000, salaryMax: 14000, skills: ["IFRS", "Audit standards", "Attention to detail"] },
  { title: "Data Analyst", sector: "Tech & Digital", level: "Entry", salaryMin: 10000, salaryMax: 16000, skills: ["SQL", "Python", "Power BI / Tableau"] },
  { title: "Data Scientist", sector: "Tech & Digital", level: "Mid", salaryMin: 18000, salaryMax: 30000, skills: ["Python", "ML", "Statistics"] },
  { title: "Software Engineer", sector: "Tech & Digital", level: "Entry", salaryMin: 12000, salaryMax: 20000, skills: ["JavaScript / TS", "Git", "REST APIs"] },
  { title: "Senior Software Engineer", sector: "Tech & Digital", level: "Senior", salaryMin: 25000, salaryMax: 45000, skills: ["System design", "Cloud", "Mentoring"] },
  { title: "Product Manager", sector: "Tech & Digital", level: "Mid", salaryMin: 22000, salaryMax: 38000, skills: ["Discovery", "Roadmapping", "Analytics"] },
  { title: "UX Designer", sector: "Tech & Digital", level: "Mid", salaryMin: 14000, salaryMax: 24000, skills: ["Figma", "User research", "Prototyping"] },
  { title: "DevOps Engineer", sector: "Tech & Digital", level: "Mid", salaryMin: 18000, salaryMax: 32000, skills: ["AWS / GCP", "CI/CD", "Kubernetes"] },
  { title: "IT Project Manager", sector: "Tech & Digital", level: "Senior", salaryMin: 25000, salaryMax: 42000, skills: ["Agile", "Stakeholder mgmt", "Vendor mgmt"] },
  { title: "Civil Engineer", sector: "Energy & Industry", level: "Entry", salaryMin: 9000, salaryMax: 14000, skills: ["AutoCAD", "Site mgmt", "HSE"] },
  { title: "Process Engineer", sector: "Energy & Industry", level: "Mid", salaryMin: 14000, salaryMax: 22000, skills: ["Lean", "Six Sigma", "SCADA"] },
  { title: "Plant Manager", sector: "Energy & Industry", level: "Senior", salaryMin: 30000, salaryMax: 55000, skills: ["Operations", "Leadership", "Budgeting"] },
  { title: "Renewables Project Lead", sector: "Energy & Industry", level: "Senior", salaryMin: 32000, salaryMax: 60000, skills: ["Solar / wind", "Project finance", "Stakeholder mgmt"] },
  { title: "Marketing Manager", sector: "Marketing & Media", level: "Mid", salaryMin: 16000, salaryMax: 28000, skills: ["Brand", "Performance", "Analytics"] },
  { title: "Content Strategist", sector: "Marketing & Media", level: "Mid", salaryMin: 12000, salaryMax: 20000, skills: ["Editorial", "SEO", "Storytelling"] },
  { title: "HR Business Partner", sector: "Public Sector", level: "Mid", salaryMin: 14000, salaryMax: 24000, skills: ["Talent", "ER", "Workforce planning"] },
  { title: "Legal Counsel", sector: "Public Sector", level: "Mid", salaryMin: 18000, salaryMax: 32000, skills: ["Corporate law", "Contracts", "Compliance"] },
  { title: "Public Policy Analyst", sector: "Public Sector", level: "Entry", salaryMin: 9000, salaryMax: 14000, skills: ["Research", "Policy briefs", "Stats"] },
  { title: "Supply Chain Analyst", sector: "Logistics", level: "Entry", salaryMin: 9000, salaryMax: 14000, skills: ["Excel", "ERP", "Forecasting"] },
  { title: "Logistics Manager", sector: "Logistics", level: "Senior", salaryMin: 25000, salaryMax: 42000, skills: ["Operations", "WMS", "Vendor mgmt"] },
  { title: "Agronomist", sector: "Agribusiness", level: "Entry", salaryMin: 8000, salaryMax: 13000, skills: ["Field studies", "Soil science", "Crop mgmt"] },
  { title: "Export Manager", sector: "Agribusiness", level: "Senior", salaryMin: 22000, salaryMax: 38000, skills: ["Trade", "Languages", "Negotiation"] },
  { title: "Hotel Operations Manager", sector: "Tourism & Hospitality", level: "Senior", salaryMin: 22000, salaryMax: 40000, skills: ["F&B", "Guest experience", "PMS"] },
  { title: "Founder / Co-founder", sector: "Entrepreneurship", level: "Senior", salaryMin: 0, salaryMax: 50000, skills: ["Resilience", "Fundraising", "Hiring"] },
];

export type Employer = {
  name: string;
  sector: string;
  size: "SME" | "Large" | "Group";
  hiring: boolean;
};

export const EMPLOYERS: Employer[] = [
  { name: "OCP Group", sector: "Energy & Industry", size: "Group", hiring: true },
  { name: "Attijariwafa Bank", sector: "Finance & Banking", size: "Group", hiring: true },
  { name: "Maroc Telecom", sector: "Tech & Digital", size: "Group", hiring: true },
  { name: "McKinsey Casablanca", sector: "Consulting", size: "Large", hiring: true },
  { name: "Deloitte Maroc", sector: "Consulting", size: "Large", hiring: true },
  { name: "BMCE Bank of Africa", sector: "Finance & Banking", size: "Group", hiring: true },
  { name: "Inwi", sector: "Tech & Digital", size: "Large", hiring: false },
  { name: "Lydec", sector: "Energy & Industry", size: "Large", hiring: false },
  { name: "Royal Air Maroc", sector: "Logistics", size: "Group", hiring: true },
  { name: "CDG (Caisse de Dépôt)", sector: "Public Sector", size: "Group", hiring: true },
  { name: "HPS Worldwide", sector: "Tech & Digital", size: "Large", hiring: true },
  { name: "Renault Tanger", sector: "Energy & Industry", size: "Group", hiring: true },
  { name: "Stellantis Kenitra", sector: "Energy & Industry", size: "Group", hiring: true },
  { name: "Marsa Maroc", sector: "Logistics", size: "Large", hiring: false },
  { name: "Cosumar", sector: "Agribusiness", size: "Large", hiring: true },
  { name: "Label Vie", sector: "Agribusiness", size: "Large", hiring: true },
  { name: "BCP Bank", sector: "Finance & Banking", size: "Group", hiring: true },
  { name: "PwC Maroc", sector: "Consulting", size: "Large", hiring: true },
  { name: "EY Maroc", sector: "Consulting", size: "Large", hiring: true },
  { name: "ONCF (Railways)", sector: "Public Sector", size: "Group", hiring: false },
];
