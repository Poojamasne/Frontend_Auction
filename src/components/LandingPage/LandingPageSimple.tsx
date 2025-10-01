import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./LandingPage.css";
import {
  Gavel,
  Users,
  Shield,
  Clock,
  TrendingUp,
  CheckCircle,
  Menu,
  ArrowUp,
  ArrowLeft,
  ArrowRight,
  Phone,
  Mail,
  MapPin,
  Zap,
} from "lucide-react";
import TermsModal from "../Common/TermsModal";

// Simple Link component using react-router's useNavigate
const SimpleLink: React.FC<{
  to: string;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}> = ({ to, className, children, onClick }) => {
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      onClick();
      return;
    }
    navigate(to);
  };

  return (
    <button type="button" className={className} onClick={handleClick}>
      {children}
    </button>
  );
};

const LandingPage: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isNavScrolled, setIsNavScrolled] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);

  const slides = [
    {
      title: "Create Professional Auctions",
      description:
        "Set up detailed auctions with participant management, document uploads, and automated notifications.",
      image:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRIncjqnfNidsdHlpY0cRH7BI5qjV9AbaLgaQ&s",
      // image:
      //   "https://images.unsplash.com/photo-1503602642458-232111445657?q=80&w=1400&auto=format&fit=crop&ixlib=rb-4.0.3&s=5d6f6a6c6a2b2f3d7e8a9b0c1d2e3f4a",
      gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    },
    {
      title: "Real-time Bidding Experience",
      description:
        "Live countdown timers, instant bid updates, and automatic auction extensions for fair competition.",
      image:
        "https://media.istockphoto.com/id/1194209555/vector/auction-online-vector-concept-for-web-banner-website-page.jpg?s=612x612&w=0&k=20&c=iKRTYOYmA1a4yE0Gy4a3Cx3W8qTgUdZvDWAOygT1IkY=",
      // image:
      //   "https://images.unsplash.com/photo-1496307042754-b4aa456c4a2d?q=80&w=1400&auto=format&fit=crop&ixlib=rb-4.0.3&s=7c9b7a3a6a9e4f8b2c3d1e5f6a7b8c9d",
      gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    },
    {
      title: "Dual Role System",
      description:
        "Switch seamlessly between auctioneer and participant roles with a single account.",
      image:
        "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=1400&auto=format&fit=crop&ixlib=rb-4.0.3&s=3a2b1c4d5e6f7a8b9c0d1e2f3a4b5c6d",
      gradient: "linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%)",
    },
    {
      title: "Secure & Reliable",
      description:
        "OTP-based authentication, secure transactions, and comprehensive audit trails.",
      image:
        "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=1400&auto=format&fit=crop&ixlib=rb-4.0.3&s=6b5d4c3f2a1e0d9c8b7a6f5e4d3c2b1a",
      gradient: "linear-gradient(135deg, #ffecd2 0%, #ff7f54ff 100%)",
    },
    {
      title: "Advanced Analytics",
      description:
        "Detailed reports, bid summaries, and performance analytics for better decision making.",
      // image:
      //   "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1400&auto=format&fit=crop&ixlib=rb-4.0.3&s=9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b",
      image: "https://cdn.corporatefinanceinstitute.com/assets/auction.jpeg",
      gradient: "linear-gradient(135deg, #a8edea 0%, #f54c82ff 100%)",
    },
  ];

  const features = [
    {
      icon: <Gavel className="w-8 h-8 text-blue-500" />,
      title: "Buyer Posts Requirements",
      description:
        "Create listings detailing goods or services needed, with specifications, quantities, and delivery schedules.",
    },
    {
      icon: <Users className="w-8 h-8 text-green-500" />,
      title: "Suppliers Register & Bid",
      description:
        "Pre-qualified suppliers register and submit initial bids, competing to offer the best price.",
    },
    {
      icon: <Clock className="w-8 h-8 text-yellow-500" />,
      title: "Real-Time Bidding",
      description:
        "Auctions run over a set period with countdown timers and progressive bid updates.",
    },
    {
      icon: <Shield className="w-8 h-8 text-indigo-500" />,
      title: "Contract Awarded",
      description:
        "Once the auction ends, buyers select the lowest or best bid based on price, quality, and reliability.",
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-pink-500" />,
      title: "Cost Savings",
      description:
        "Competitive bidding ensures buyers receive the most cost-effective options.",
    },
    {
      icon: <CheckCircle className="w-8 h-8 text-teal-500" />,
      title: "Transparency & Efficiency",
      description:
        "Streamlined processes with open bidding provide transparency and reduce negotiation time.",
    },
  ];

  const steps = [
    {
      step: "1",
      title: "Post Requirements",
      description:
        "Submit detailed specifications for goods or services needed.",
    },
    {
      step: "2",
      title: "Supplier Registration",
      description: "Invite suppliers to register and submit initial bids.",
    },
    {
      step: "3",
      title: "Real-Time Bidding",
      description: "Suppliers compete in real-time to offer the best prices.",
    },
    {
      step: "4",
      title: "Contract Award",
      description:
        "Evaluate bids and award contract to the lowest or most suitable bidder.",
    },
  ];

  const stats = [
    { number: "1000+", label: "Successful Auctions" },
    { number: "500+", label: "Active Users" },
    { number: "₹10M+", label: "Transaction Value" },
    { number: "99.9%", label: "Uptime" },
  ];

  const whyEasyAuction = [
    "No subscription fee for Buyer / Auctioner / Seller / Participant → Zero auction cost.",
    "Auctioner can arrange auctions in just a couple of minutes.",
    "Participants get SMS alerts for submission of Prebid.",
    "Auctioner & Participants get SMS alerts 10 minutes before start of Auction.",
    "Auctioner can reject unsuitable bids at Prebid or Live Auction stage.",
    "Participants can upload Product / Service Profiles for better evaluation.",
    "OTP login ensures Security & Privacy of Auction.",
    "Auction report available immediately after completion.",
    "No limit of Participants per Auction.",
    "Provides ease & speed for both Auctioner & Participant.",
  ];

  const reverseAuctionSteps = [
    {
      title: "Buyer Posts Requirements",
      description:
        "A business or government agency creates a listing detailing the goods or services it needs, along with specific requirements, quantities, and delivery schedules.",
    },
    {
      title: "Suppliers Register & Bid",
      description:
        "Pre-qualified suppliers are invited to participate. They register on the platform and submit their initial bids",
    },
    {
      title: "Real-Time Bidding",
      description:
        "The auction takes place over a set period, often with a countdown timer. Suppliers submit progressively lower bids in real-time, typically with the ability to see the leading low bid.",
    },
    {
      title: "Auction Closes & Award",
      description:
        "Once the auction timer runs out, the buyer evaluates the bids based on criteria that can include price, quality, and supplier reliability. The lowest—or best—bidder is then awarded the contract.",
    },
  ];

  const reverseAuctionBenefits = [
    {
      title: "Cost Savings",
      description:
        "Competition between suppliers drives best possible pricing.",
    },
    {
      title: "Transparency",
      description: "Open bidding process reduces favoritism & corruption.",
    },
    {
      title: "Expanded Supplier Base",
      description: "Access more suppliers, including SMEs, for wider choices.",
    },
    {
      title: "Efficiency",
      description:
        "Automated reverse auction reduces negotiation time & effort.",
    },
    {
      title: "Data Insights",
      description:
        "Real-time feedback helps procurement teams make smarter decisions.",
    },
  ];

  const reverseAuctionUses = [
    {
      title: "Government Procurement",
      description:
        "Used for acquiring office supplies to complex projects with cost-effectiveness.",
    },
    {
      title: "Manufacturing",
      description:
        "Procure raw materials, machinery, and components competitively.",
    },
    {
      title: "Logistics & Transportation",
      description:
        "Businesses invite carriers to bid for freight and shipping contracts.",
    },
    {
      title: "Retail",
      description:
        "Negotiate better prices for goods and inventory using reverse auctions.",
    },
  ];

  // Auto-slide functionality
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
      setIsNavScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className={`landing-nav ${isNavScrolled ? "scrolled" : ""}`}>
        <div className="nav-container">
          <div className="nav-logo">
            <div className="nav-logo-icon">
              <Gavel className="w-6 h-6" />
            </div>
            <span className="nav-logo-text">EasyEAuction</span>
          </div>

          <ul className="nav-menu">
            <li>
              <a
                href="#features"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection("features");
                }}
              >
                Features
              </a>
            </li>
            <li>
              <a
                href="#how-it-works"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection("how-it-works");
                }}
              >
                How It Works
              </a>
            </li>
            <li>
              <a
                href="#stats"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection("stats");
                }}
              >
                Stats
              </a>
            </li>
            <li>
              <a
                href="#contact"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection("contact");
                }}
              >
                Contact
              </a>
            </li>
          </ul>

          <SimpleLink to="/login" className="nav-cta">
            Get Started
          </SimpleLink>

          <button
            className="nav-toggle"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-floating">
          <Gavel className="w-6 h-6" />
        </div>
        <div className="hero-floating">
          <TrendingUp className="w-6 h-6" />
        </div>
        <div className="hero-floating">
          <Zap className="w-6 h-6" />
        </div>

        <div className="container">
          <div className="hero-content loading-fade-in check1">
            <h1 className="hero-title">Professional Auction Platform</h1>
            <p className="hero-subtitle">
              Create, manage and participate in auctions with our comprehensive
              platform. Features real-time bidding, automated notifications and
              detailed reporting.
            </p>
            <div className="hero-buttons">
              <SimpleLink to="/login" className="cta-button">
                Start Auctioning →
              </SimpleLink>
              <button
                className="cta-button"
                onClick={() => scrollToSection("features")}
              >
                Learn More
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Image Slider */}
      <section className="container">
        <div className="slider-container">
          <div
            className="slider-wrapper"
            style={{ transform: `translateX(-${currentSlide * 20}%)` }}
          >
            {slides.map((slide, index) => (
              <div
                key={index}
                className="slider-slide"
                style={{ background: slide.gradient }}
              >
                {slide.image && (
                  <div className="slider-image-wrap">
                    <img
                      className="slider-image"
                      src={slide.image}
                      alt={slide.title}
                    />
                  </div>
                )}
                <div className="slider-content">
                  <h3 className="slider-title">{slide.title}</h3>
                  <p className="slider-description">{slide.description}</p>
                </div>
              </div>
            ))}
          </div>

          <button
            className="slider-arrow prev"
            onClick={prevSlide}
            aria-label="Previous slide"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button
            className="slider-arrow next"
            onClick={nextSlide}
            aria-label="Next slide"
          >
            <ArrowRight className="w-5 h-5" />
          </button>

          <div className="slider-nav">
            {slides.map((_, index) => (
              <button
                key={index}
                className={`slider-dot ${
                  index === currentSlide ? "active" : ""
                }`}
                onClick={() => setCurrentSlide(index)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="container">
          <div className="text-center loading-fade-in check">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need for Successful Auctions
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our platform provides all the tools and features needed to conduct
              professional auctions
            </p>
          </div>

          <div className="features-grid">
            {features.map((feature, index) => (
              <div
                key={index}
                className="feature-card loading-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="feature-icon">{feature.icon}</div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="how-it-works">
        <div className="container">
          <div className="text-center loading-fade-in check">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Get started with our platform in just a few simple steps
            </p>
          </div>

          <div className="steps-container">
            {steps.map((step, index) => (
              <div
                key={index}
                className="step-card loading-fade-in"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <div className="step-number">{step.step}</div>
                <h3
                  className={`step-title ${
                    [
                      "Register with Phone",
                      "Create or Join",
                      "Start Bidding",
                      "Track Results",
                    ].includes(step.title)
                      ? "how-step-highlight"
                      : ""
                  }`}
                >
                  {step.title}
                </h3>
                <p className="step-description">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="stats-section">
        <div className="container">
          <div className="stats-grid">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="stat-card loading-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="stat-number">{stat.number}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content loading-fade-in">
            <h2 className="cta-title">Ready to Start Your Auction Journey?</h2>
            <p className="cta-description">
              Join thousands of users who trust our platform for their auction
              needs. Create your account today and experience the future of
              digital auctions.
            </p>
            <SimpleLink to="/login" className="cta-button">
              Get Started Now
              <span>→</span>
            </SimpleLink>
            <button
              className="cta-button m-2"
              onClick={() => setIsTermsModalOpen(true)}
            >
              Terms & Conditions
            </button>
          </div>
        </div>
      </section>

      {/* Terms Modal */}
      <TermsModal
        isOpen={isTermsModalOpen}
        onClose={() => setIsTermsModalOpen(false)}
      />

      {/* Why EasyEAuction Section */}
      <section className="info-section py-12">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-6">
            Why EasyEAuction.com?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {whyEasyAuction.map((point, idx) => (
              <div
                key={idx}
                className="info-cardd p-6 bg-white shadow-md rounded-xl hover:shadow-lg transition"
              >
                <p className="text-gray-700">{point}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reverse Auction Steps Section */}
      <section className="info-section py-12">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-6">
            How a Reverse Auction Works
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reverseAuctionSteps.map((step, idx) => (
              <div
                key={idx}
                className="info-cardd p-6 bg-white shadow-md rounded-xl hover:shadow-lg transition"
              >
                <h3 className="font-semibold text-lg mb-2 mr-2">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reverse Auction Benefits */}
      <section className="info-section py-12">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-6">
            Key Benefits of Reverse Auctions
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reverseAuctionBenefits.map((benefit, idx) => (
              <div
                key={idx}
                className="info-cardd p-6 bg-white shadow-md rounded-xl hover:shadow-lg transition"
              >
                <h3 className="font-semibold text-lg mb-2 mr-2">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reverse Auction Common Uses */}
      <section className="info-section py-12">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-6">
            Common Uses of Reverse Auctions
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reverseAuctionUses.map((use, idx) => (
              <div
                key={idx}
                className="info-cardd p-6 bg-white shadow-md rounded-xl hover:shadow-lg transition"
              >
                <h3 className="font-semibold text-lg mb-2 mr-2">{use.title}</h3>
                <p className="text-gray-600">{use.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <div className="footer-logo">
                <div className="footer-logo-icon">
                  <Gavel className="w-6 h-6" />
                </div>
                <span className="footer-logo-text">EasyEAuction</span>
              </div>
              <p>
                Professional auction platform for modern businesses. Streamline
                your auction process with our comprehensive tools and features.
              </p>
            </div>

            <div className="footer-section">
              <h3>Platform</h3>
              <ul>
                <li>
                  <a href="#none">Create Auction</a>
                </li>
                <li>
                  <a href="#none">Join Auction</a>
                </li>
                <li>
                  <a href="#none">Reports & Analytics</a>
                </li>
                <li>
                  <a href="#none">Admin Panel</a>
                </li>
                <li>
                  <a href="#none">API Documentation</a>
                </li>
              </ul>
            </div>

            <div className="footer-section">
              <h3>Support</h3>
              <ul>
                <li>
                  <a href="#contact">Help Center</a>
                </li>
                <li>
                  <a href="#contact">Contact Support</a>
                </li>
                <li>
                  <a href="#contact">Documentation</a>
                </li>
                <li>
                  <a href="#contact">Terms of Service</a>
                </li>
                <li>
                  <a href="#contact">Privacy Policy</a>
                </li>
              </ul>
            </div>

            <div className="footer-section">
              <h3>Contact Information</h3>
              <ul>
                <li>
                  <Mail className="w-4 h-4 inline-block mr-2" />{" "}
                  sales.easyeauction@gmail.com
                </li>
                <li>
                  <Phone className="w-4 h-4 inline-block mr-2" /> +91 9876543210
                </li>
                <li>
                  <MapPin className="w-4 h-4 inline-block mr-2" /> Mumbai,
                  Maharashtra, India
                </li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <p>
              &copy; 2025 EasyEAuction. All rights reserved. Built with for
              modern auctions.
            </p>
          </div>
        </div>
      </footer>

      {/* Scroll to Top Button */}
      <button
        className={`scroll-to-top ${showScrollTop ? "visible" : ""}`}
        onClick={scrollToTop}
        aria-label="Scroll to top"
      >
        <ArrowUp className="w-5 h-5" />
      </button>
    </div>
  );
};

export default LandingPage;
