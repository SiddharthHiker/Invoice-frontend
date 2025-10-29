import { BarChart2, FileText, LayoutDashboard, Mail, Plus, Sparkles, Users } from "lucide-react";

export const FEATURES = [
    {
        icon: Sparkles,
        title: "AI Invoice Creation",
        description:
            "Paste any text, email, or receipt, and let our AI instantly generate a complete, professional invoice for you.",
    },
    {
        icon: BarChart2,
        title: "AI-Powered Dashboard",
        description: "Get smart, actionable insights about your bussiness finances, generated automatically by our AI analyst.",


    },
    {
        icon: Mail,
        title: "Smart Reminders",
        description: "Automatically generate polite and effective payment reminder emails for overdue invoices with a single click.",


    },
    {
        icon: FileText,
        title: "Easy Invoice Management",
        description: "Easily manage all your invoices, track payments, and send reminder for overdue payments.",


    },
];

export const TESTIMONIALS = [
    {
        quote: "This app saved me hours of work. I can now create and send invoice in minutes.",
        author: "Deepak Prasad",
        title: "Freelance Designer",
        avatar: "https://placehold.co/100x100/000000/ffffff?text=DP"
    },
    {
        quote: "The best invoicing app I have ever used. Simple, intuitive, and powerful.",
        author: "Siddharth Anand",
        title: "Small Business Owner",
        avatar: "https://placehold.co/100x100/000000/ffffff?text=SA."
    },
    {
        quote: "I love the dashboard and reporting features.It helps me keep track of my finances effortlessly.",
        author: "Shivam Kumar",
        title: "Consultant",
        avatar: "https://placehold.co/100x100/000000/ffffff?text=SK"
    }
];

export const FAQS = [
    {
        question: "How does the AI invoice creation work?",
        answer: "Simply paste any text that contains invoice details—like an email, a list of items, or a work summary—and our AI will instantly parse it to pre-fill a new invoice for you, saving you time and effort."
    },
    {
        question: "Is there a free trial available?",
        answer: "Yes, you can try our platform for free for 14 days. If you want, we'll help you get started with all features available during the trial period."
    },
    {
        question: "Can I change my plan later?",
        answer: "Of course. Our pricing scales with your company. Chat to our friendly team to discuss plan changes that suit your evolving needs."
    },
    {
        question: "What is your cancellation policy?",
        answer: "We understand that things change. You can cancel your plan at any time and will retain access until the end of your current billing period."
    },
    {
        question: "Can other info be added to an invoice?",
        answer: "Yes, you can add notes, payment terms, and even attach files to your invoices for complete documentation."
    },
    {
        question: "How does billing work?",
        answer: "Plans are per workspace, not per account. You can upgrade one workspace while keeping others on different plans, and billing is handled separately for each workspace."
    }
];

// Navigation items configuration
export const NAVIGATION_MENU =[
    {id:"dashboard", name: "Dashboard",icon: LayoutDashboard},
    {id:"invoices", name: "Invoices",icon: FileText},
    {id:"invoices/new", name: "Create Invoice",icon: Plus},
    {id:"profile", name: "Profile",icon: Users},   
];

