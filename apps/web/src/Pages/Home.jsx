import React, { useState } from 'react';
import '../Styles/Home.css';
import { 
  Sparkles, 
  Calendar, 
  MessageSquare, 
  ShieldCheck, 
  Camera, 
  ArrowRight, 
  Star, 
  Check, 
  Layers, 
  Zap, 
  Heart,
  TrendingUp,
  Award
} from 'lucide-react';

const Home = () => {
  // States for interactive simulator
  const [lipstickColor, setLipstickColor] = useState('#e11d48'); // Default rose-red
  const [eyeshadowColor, setEyeshadowColor] = useState('#f43f5e'); // Default warm pink
  const [foundationTone, setFoundationTone] = useState('#fde047'); // Default warm honey
  
  const lipstickOptions = [
    { name: 'Classic Red', hex: '#be123c' },
    { name: 'Warm Coral', hex: '#f97316' },
    { name: 'Plum Berry', hex: '#701a75' },
    { name: 'Nude Pink', hex: '#db2777' },
    { name: 'Crimson Glow', hex: '#991b1b' }
  ];

  const eyeshadowOptions = [
    { name: 'Sunset Bronze', hex: '#ca8a04' },
    { name: 'Rose Petal', hex: '#ec4899' },
    { name: 'Midnight Purple', hex: '#581c87' },
    { name: 'Emerald Sparkle', hex: '#0f766e' }
  ];

  return (
    <div className="home-container" id="home">
      {/* Background Decorative Blobs */}
      <div className="blob blob-1"></div>
      <div className="blob blob-2"></div>
      <div className="blob blob-3"></div>

      {/* 1. HERO SECTION */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="badge-wrapper">
            <span className="hero-badge">
              <Sparkles size={14} className="icon-pulse" /> Powered by GlamAI AR Engine
            </span>
          </div>
          
          <h1 className="hero-title">
            Find Your Glow. <br />
            <span>Virtual Try-On,</span> <br />
            Instant Booking.
          </h1>
          
          <p className="hero-subtitle">
            GlamAI bridges the gap between you and world-class beauty professionals. Virtually test stunning makeup looks and book verified artists in your area instantly.
          </p>

          <div className="download-badges">
            <a href="#download" className="store-badge play-store">
              <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Get it on Google Play" />
            </a>
            <a href="#download" className="store-badge app-store">
              <img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" alt="Download on the App Store" />
            </a>
          </div>

          <div className="hero-stats">
            <div className="stat-item">
              <h3>15k+</h3>
              <p>Active Users</p>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <h3>300+</h3>
              <p>Certified Artists</p>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <h3>4.9 ★</h3>
              <p>Store Rating</p>
            </div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="mockup-frame">
            <div className="mockup-screen">
              <img src="/Images/app_mockup.png" alt="GlamAI Mobile Application mockup" className="mockup-image" />
            </div>
            <div className="floating-card chat-card">
              <MessageSquare size={16} className="card-icon" />
              <div>
                <h4>Chatting with Sarah</h4>
                <p>Can you do a bronze look?</p>
              </div>
            </div>
            <div className="floating-card artist-card">
              <div className="artist-avatar">M</div>
              <div>
                <h4>Maya Lin (Artist)</h4>
                <p>Bridal Makeup Specialist</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. INTERACTIVE SIMULATOR (AI virtual try-on highlight) */}
      <section className="simulator-section" id="try-on">
        <div className="section-header">
          <span className="section-tag">AI Tech Showcase</span>
          <h2>Experience AI Try-On Live</h2>
          <p>Interact with our custom simulator to see how our AR engine maps colors and layers in real-time.</p>
        </div>

        <div className="simulator-container">
          <div className="simulator-visual">
            <div className="interactive-face-container">
              <img src="/Images/beauty_hero.png" alt="Beauty model" className="face-image" />
              
              {/* Lipstick Layer Tint */}
              <div 
                className="face-overlay lips-overlay" 
                style={{ 
                  backgroundColor: lipstickColor,
                  opacity: 0.35,
                  mixBlendMode: 'multiply'
                }}
              ></div>

              {/* Eyeshadow Layer Tint */}
              <div 
                className="face-overlay eyes-overlay" 
                style={{ 
                  backgroundColor: eyeshadowColor,
                  opacity: 0.2,
                  mixBlendMode: 'color'
                }}
              ></div>
            </div>
          </div>

          <div className="simulator-controls">
            <h3>Custom Palette Settings</h3>
            <p>Tweak shades below to observe the real-time simulation overlay.</p>

            <div className="control-group">
              <label>Lipstick Shade</label>
              <div className="color-options">
                {lipstickOptions.map((opt) => (
                  <button 
                    key={opt.name}
                    className={`color-pill ${lipstickColor === opt.hex ? 'active' : ''}`}
                    style={{ backgroundColor: opt.hex }}
                    onClick={() => setLipstickColor(opt.hex)}
                    title={opt.name}
                  />
                ))}
              </div>
            </div>

            <div className="control-group">
              <label>Eyeshadow Shade</label>
              <div className="color-options">
                {eyeshadowOptions.map((opt) => (
                  <button 
                    key={opt.name}
                    className={`color-pill ${eyeshadowColor === opt.hex ? 'active' : ''}`}
                    style={{ backgroundColor: opt.hex }}
                    onClick={() => setEyeshadowColor(opt.hex)}
                    title={opt.name}
                  />
                ))}
              </div>
            </div>

            <div className="tech-specs">
              <div className="spec-item">
                <Camera size={18} />
                <span>Real-Time Face Mesh (68 Landmarks)</span>
              </div>
              <div className="spec-item">
                <Zap size={18} />
                <span>Zero Latency Processing</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CORE FEATURES SECTION */}
      <section className="features-section" id="features">
        <div className="section-header">
          <span className="section-tag">Key Features</span>
          <h2>Everything You Need to Look Your Best</h2>
          <p>GlamAI is designed from the ground up to offer the absolute finest digital booking & cosmetics experience.</p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="icon-wrapper">
              <Camera size={24} />
            </div>
            <h3>Virtual AR Try-On</h3>
            <p>Try thousands of cosmetics products and shade palettes instantly before purchasing or booking an artist.</p>
          </div>

          <div className="feature-card">
            <div className="icon-wrapper">
              <Calendar size={24} />
            </div>
            <h3>Instant Booking System</h3>
            <p>Book makeup artists based on location, availability, budget, and specialty in just three clicks.</p>
          </div>

          <div className="feature-card">
            <div className="icon-wrapper">
              <MessageSquare size={24} />
            </div>
            <h3>Direct Consultations</h3>
            <p>Message, share reference photos, and clarify custom cosmetics requirements directly with your artist in-app.</p>
          </div>

          <div className="feature-card">
            <div className="icon-wrapper">
              <ShieldCheck size={24} />
            </div>
            <h3>Escrow Payments</h3>
            <p>Your money is safe. Payment is only released to the artist after the booking is completed to your satisfaction.</p>
          </div>

          <div className="feature-card">
            <div className="icon-wrapper">
              <Layers size={24} />
            </div>
            <h3>Detailed Portfolios</h3>
            <p>Inspect high-resolution work galleries, verified client reviews, and official certifications of artists.</p>
          </div>

          <div className="feature-card">
            <div className="icon-wrapper">
              <TrendingUp size={24} />
            </div>
            <h3>AI Trend Analysis</h3>
            <p>Get personalized style recommendations matching seasonal beauty trends, face shapes, and skin tones.</p>
          </div>
        </div>
      </section>

      {/* 4. ADVANTAGES SECTION */}
      <section className="advantages-section" id="advantages">
        <div className="section-header">
          <span className="section-tag">Why GlamAI</span>
          <h2>Designed for Both Clients & Artists</h2>
          <p>We provide massive value for both customers seeking beauty makeovers and professional makeup artists looking to scale.</p>
        </div>

        <div className="advantages-columns">
          {/* For Clients */}
          <div className="advantages-column card-glass">
            <div className="col-header">
              <Heart size={20} className="icon-pink" />
              <h3>For Glam Seekers</h3>
            </div>
            <ul className="advantages-list">
              <li>
                <div className="check-icon"><Check size={14} /></div>
                <div>
                  <strong>Risk-Free Trials:</strong> Zero guesswork. See exactly how a look looks on your face before committing.
                </div>
              </li>
              <li>
                <div className="check-icon"><Check size={14} /></div>
                <div>
                  <strong>Verified Talent:</strong> Every single artist on our platform goes through credential vetting.
                </div>
              </li>
              <li>
                <div className="check-icon"><Check size={14} /></div>
                <div>
                  <strong>No Hidden Fees:</strong> Transparent booking pricing with upfront security escrow.
                </div>
              </li>
              <li>
                <div className="check-icon"><Check size={14} /></div>
                <div>
                  <strong>Hyperlocal Search:</strong> Locate high-quality artists right in your neighborhood.
                </div>
              </li>
            </ul>
          </div>

          {/* For Artists */}
          <div className="advantages-column card-glass">
            <div className="col-header">
              <Award size={20} className="icon-pink" />
              <h3>For Beauty Artists</h3>
            </div>
            <ul className="advantages-list">
              <li>
                <div className="check-icon"><Check size={14} /></div>
                <div>
                  <strong>Instant Audience:</strong> Showcase your work directly to thousands of local clients.
                </div>
              </li>
              <li>
                <div className="check-icon"><Check size={14} /></div>
                <div>
                  <strong>Effortless Invoicing:</strong> Automated payment management, cancellation policies, and payouts.
                </div>
              </li>
              <li>
                <div className="check-icon"><Check size={14} /></div>
                <div>
                  <strong>Interactive Consults:</strong> Share pre-made virtual try-on templates to quickly agree on look designs.
                </div>
              </li>
              <li>
                <div className="check-icon"><Check size={14} /></div>
                <div>
                  <strong>Flexible Schedule:</strong> Total control over calendar availability, location range, and custom rates.
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 5. HOW IT WORKS SECTION */}
      <section className="how-it-works-section" id="how-it-works">
        <div className="section-header">
          <span className="section-tag">Simple Steps</span>
          <h2>How GlamAI Works</h2>
          <p>Get ready for a seamless, enjoyable beauty transformation.</p>
        </div>

        <div className="steps-container">
          <div className="step-card">
            <div className="step-number">01</div>
            <h3>Download & Try</h3>
            <p>Get the app, take a quick selfie, and experiment with hundreds of makeup palettes and styling templates.</p>
          </div>

          <div className="step-line"></div>

          <div className="step-card">
            <div className="step-number">02</div>
            <h3>Discover & Connect</h3>
            <p>Filter artists by distance, style expertise, and rating. Send them your virtual try-on details via chat.</p>
          </div>

          <div className="step-line"></div>

          <div className="step-card">
            <div className="step-number">03</div>
            <h3>Book & Glow</h3>
            <p>Schedule your session, submit the payment to escrow, and meet your artist to achieve your gorgeous look!</p>
          </div>
        </div>
      </section>

      {/* 6. CALL TO ACTION SECTION */}
      <section className="download-section" id="download">
        <div className="download-banner">
          <div className="download-banner-text">
            <h2>Ready to Transform Your Beauty Experience?</h2>
            <p>Download GlamAI now on iOS and Android to unlock virtual styling filters and access elite local makeup artists.</p>
            
            <div className="download-badges">
              <a href="#" className="store-badge play-store">
                <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Get it on Google Play" />
              </a>
              <a href="#" className="store-badge app-store">
                <img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" alt="Download on the App Store" />
              </a>
            </div>
          </div>
          <div className="download-banner-image">
            <img src="/Images/app_mockup.png" alt="GlamAI Application Screenshots" />
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;