---
marp: true
theme: gaia
_class: lead
paginate: true
backgroundColor: #FFF9FB
color: #2D2D2D
style: |
  section {
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    padding: 50px;
    font-size: 26px;
  }
  h1 {
    color: #D81B60;
    font-weight: 800;
  }
  h2 {
    color: #FF4F87;
    font-size: 1.4em;
    border-bottom: 2px solid #FFE3ED;
    padding-bottom: 10px;
  }
  h3 {
    color: #8E24AA;
    font-size: 1.1em;
  }
  footer {
    font-size: 0.5em;
    color: #B28D9A;
  }
  code {
    background: #FFF0F4;
    color: #C2185B;
    font-size: 0.8em;
  }
---

# GlamBook: AI Makeup Booking Platform
## Connecting Customers and Professional Artists through Tech
### Slide 1

---

# Business Problem
* **Discovery Friction**: Customers scroll Instagram for hours looking for trusted local makeup artists (MUAs).
* **Visualization Gap**: Customers book expensive sessions without knowing how looks will suit their face shape or skin tone.
* **Lack of Trust**: No centralized validation for MUA qualifications and certifications.
### Slide 2

---

# Current Challenges
* **For Customers**: High booking uncertainty; tedious scheduling over DMs.
* **For Artists**: Calendar conflicts; loss of income from no-shows or last-minute cancellations.
* **For Admins**: Manual certificate verification bottlenecks; complex commission and payout tracking.
### Slide 3

---

# Our Solution
* **AI Face Shape & Tone Analysis**: Uses camera/upload to guide cosmetic matches.
* **Smart Matchmaker**: Matches client skin profiles, style choices, and budget constraints to MUA specializations.
* **Secure Payment & Booking**: Secure JWT workflows, automated deposits, and digital ledger control.
### Slide 4

---

# Product Vision
* **Core Philosophy**: To make professional beauty services predictable, personalized, and accessible to everyone, anywhere.
* **Key Pillars**:
  * **Trust**: Verified MUA profiles and credentials.
  * **Personalization**: Data-driven style recommendations.
  * **Ease**: Automated booking scheduler.
### Slide 5

---

# Target Users
* **Customer**: Seeks verified MUAs, AI analysis, visual guides, and fast booking.
* **Makeup Artist**: Wants portfolio showcases (Before/After), slot controls, and automated bank payouts.
* **Admin**: Supervise platform, approve certificates, audit payouts, and monitor system health diagnostics.
### Slide 6

---

# Customer Journey
* **1. Scan**: Client uses Face Scanner to get face shape (e.g. Oval) and skin tone (e.g. Warm).
* **2. Match**: Interactive Wizard scores and filters local MUAs.
* **3. Select**: Client views portfolios, selects a date, time, and service add-ons.
* **4. Book**: Client pays an advance deposit.
* **5. Connect**: Instantly starts a message thread with the MUA.
### Slide 7

---

# Customer Features
* **AI Scan & Result Card**: Custom metrics (Forehead, Symmetry).
* **MUA Matcher**: 3-step wizard (Skin Type $\rightarrow$ Budget $\rightarrow$ Style).
* **Visual Looks Preview**: Step-by-step styling overlays.
* **Wishlist**: Save favorite artists.
* **In-App Chat**: Direct communication with assigned artists.
### Slide 8

---

# Artist Features
* **MUA Registration**: 6-step verification form (Certificates, bio, location, payment accounts).
* **Service Configurator**: Duration, price range, and custom categories.
* **Before / After Portfolios**: Simple transformation uploads.
* **Calendar Planner**: Prevent double-bookings by blocking dates.
* **Revenue Book**: Track platform payout history.
### Slide 9

---

# Admin Dashboard
* **Verification Panel**: Audit uploaded certificates to approve/reject MUAs.
* **User Manager**: Toggle status (Active / Blocked) for users.
* **Financial Ledger**: Manage commission rates and platform earnings.
* **Diagnostic Control**: Inspect Database health, cloud storage pings, and SMS credits.
### Slide 10

---

# AI Features
* **Face Oval Finder**: Guides camera positioning.
* **Shape Classifier**: Categorizes face shape by measuring facial metrics.
* **Undertone Detector**: Uses RGB swatches to identify tone (e.g. Medium Warm).
* **Match Formula**: 
  $$\text{Score} = (0.3 \times \text{Specialization}) + (0.3 \times \text{Budget}) + (0.4 \times \text{Rating})$$
* **Visual Look walkthroughs**: Step-by-step guides for eye/lip overlays.
### Slide 11

---

# Technology Stack
* **Frontend Mobile**: React Native (Android / iOS)
* **Frontend Web**: React 19 + Vite (CSS Variables, Lucide Icons)
* **Backend REST API**: Node.js + Express.js v5 (ES Modules)
* **Database & ORM**: Sequelize ORM (SQLite / PostgreSQL)
* **Media Uploads**: Cloudinary API
* **Gateways**: 2Factor.in SMS API
### Slide 12

---

# System Architecture
* **Clients**: React Native Mobile App & React 19 Vite Web Admin
* **API Middleware**: Express Server with JWT Route Protection
* **Data Layer**: Sequelize ORM connecting to DB instance
* **Storage & Alerts**: Cloudinary (Assets) and 2Factor (SMS alerts)
### Slide 13

---

# Database Design
* **Core Relations**:
  * `Artists` has one `ArtistProfiles` and one `ArtistPayments`.
  * `Artists` has many `Specializations`, `Certificates`, `Services`, `Portfolios`.
  * `Bookings` links `Customers` and `Artists` with slots, advance amounts, and statuses.
  * `Wishlist` acts as a join table between `Customers` and `Artists`.
### Slide 14

---

# API Workflow (Booking)
1. `POST /customer/auth/login` $\rightarrow$ returns JWT validation.
2. `GET /artist?style=Bridal&budget=mid` $\rightarrow$ runs score filter.
3. `GET /artist/:id/profile` $\rightarrow$ fetches selected portfolio.
4. `POST /booking/create` $\rightarrow$ inserts booking slot (Pending).
5. `POST /booking/:id/payment` $\rightarrow$ confirms deposit (Confirmed).
### Slide 15

---

# Security Measures
* **Stateless JWT**: Standard API header protection.
* **bcrypt Salting**: Safe password hashes (10 rounds).
* **Access Middleware**: Enforces separate customer, artist, and admin routes.
* **AES-256-CBC Encryption**: Encrypts sensitive bank account numbers and IFSC details.
### Slide 16

---

# Future Enhancements
* **AR Live Virtual Makeup**: Real-time camera color filter overlays.
* **WebRTC Video Calls**: Pre-event live MUA consultations.
* **Generative Beauty Chatbot**: Skincare recommendation agent.
* **Voice Search**: Voice command filtering.
* **Peak Surge Pricing**: Dynamic price optimization for artists.
### Slide 17

---

# Business Benefits
* **For Customers**: Discovery confidence, zero pricing surprises, look previews.
* **For Artists**: Protection from no-shows via deposits, larger customer reach.
* **For Admins**: Sustainable revenue model (10%–15% commission per transaction).
### Slide 18

---

# Live Demo Flow
* **Step 1**: Client registers & scans face to detect shape.
* **Step 2**: Runs match wizard to find compatible MUA.
* **Step 3**: Client selects date/time slot, pays advance deposit.
* **Step 4**: Artist accepts booking in calendar.
* **Step 5**: Admin audits platform metrics and tests integrations.
### Slide 19

---

# Thank You!
## Questions & Discussion
* **Presenter**: [Your Name]
* **Email**: [Your Email]
* **GitHub**: [Your Repository]
* *Empowering Artists. Personalizing Beauty. Securing Transactions.*
### Slide 20
