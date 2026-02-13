import {
    Component,
    OnInit,
    OnDestroy,
    AfterViewInit,
    HostListener,
    signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

@Component({
    selector: 'app-landing',
    standalone: true,
    imports: [CommonModule],
    template: `
    <!-- NAVBAR -->
    <nav class="nav" [class.scrolled]="scrolled()" [class.compact]="navCompact()">
      <div class="nav__inner">
        <a class="nav__logo" (click)="scrollTop()">KAIRO</a>
        <div class="nav__links">
          <a (click)="scrollTo('how')">How It Works</a>
          <a (click)="scrollTo('categories')">Services</a>
          <a (click)="scrollTo('vendors')">For Vendors</a>
          <a (click)="scrollTo('trust')">About</a>
        </div>
        <button class="nav__cta" (click)="goRegister()" aria-label="Get Started">Get Started</button>
      </div>
    </nav>

    <main class="page">
      <!-- HERO -->
      <section class="hero">
        <div class="hero__grid-bg" aria-hidden="true"></div>
        <div class="hero__content" data-anim>
          <p class="hero__eyebrow">Hyperlocal Services Platform</p>
          <h1 class="hero__title">LOCAL SERVICES.<br/>INSTANT ACCESS.</h1>
          <p class="hero__sub">Book verified electricians, plumbers, cleaners and more in your neighbourhood. Transparent pricing, real-time updates, on-demand.</p>
          <div class="hero__ctas">
            <button class="btn btn--primary btn--shimmer" (click)="goRegister()" aria-label="Explore Services">
              Explore Services
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
            <button class="btn btn--outline" (click)="goVendor()" aria-label="Become a Vendor">Become a Vendor</button>
          </div>
        </div>
        <div class="hero__visual" data-anim>
          <div class="hero__card">
            <div class="hero__card-top">
              <div class="hero__card-avatar">R</div>
              <div>
                <p class="hero__card-name">Raju Electricals</p>
                <p class="hero__card-cat">Electrical</p>
              </div>
              <span class="hero__card-badge">VERIFIED</span>
            </div>
            <div class="hero__card-rating">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#00bfa6" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26"/></svg>
              4.8 &middot; 142 jobs &middot; From &#8377;250
            </div>
            <div class="hero__card-services">
              <span>Wiring</span><span>MCB Repair</span><span>Fan Install</span>
            </div>
          </div>
        </div>
      </section>

      <!-- HOW IT WORKS -->
      <section class="section" id="how">
        <div class="section__header" data-anim>
          <p class="section__eyebrow">How Kairo Works</p>
          <h2 class="section__title">THREE STEPS. DONE.</h2>
        </div>
        <div class="steps">
          @for (step of steps; track step.num) {
            <div class="step" data-anim>
              <span class="step__num">{{ step.num }}</span>
              <div class="step__icon" [innerHTML]="step.icon"></div>
              <h3 class="step__title">{{ step.title }}</h3>
              <p class="step__desc">{{ step.desc }}</p>
            </div>
          }
        </div>
      </section>

      <!-- CATEGORIES -->
      <section class="section" id="categories">
        <div class="section__header" data-anim>
          <p class="section__eyebrow">Service Categories</p>
          <h2 class="section__title">WHAT DO YOU NEED?</h2>
        </div>
        <div class="cat-scroll" data-anim>
          @for (cat of serviceCategories; track cat.name) {
            <div class="cat-block">
              <div class="cat-block__icon" [innerHTML]="cat.icon"></div>
              <span class="cat-block__label">{{ cat.name }}</span>
            </div>
          }
        </div>
      </section>

      <!-- FOR VENDORS -->
      <section class="vendor-band" id="vendors">
        <div class="vendor-band__inner">
          <div class="vendor-band__text" data-anim>
            <p class="section__eyebrow">For Service Providers</p>
            <h2 class="section__title">GROW YOUR LOCAL PRESENCE</h2>
            <p class="vendor-band__desc">Stop competing on national platforms. Kairo connects you directly with nearby customers who need your skills. Set your prices, manage your schedule, get paid.</p>
            <div class="vendor-band__stats">
              <div class="stat" data-anim>
                <span class="stat__num" [attr.data-target]="500">0</span>
                <span class="stat__label">Vendors Onboarded</span>
              </div>
              <div class="stat" data-anim>
                <span class="stat__num" [attr.data-target]="12">0</span>
                <span class="stat__label">Cities Covered</span>
              </div>
              <div class="stat" data-anim>
                <span class="stat__num" [attr.data-target]="10">0</span>
                <span class="stat__label">Service Categories</span>
              </div>
            </div>
            <button class="btn btn--primary" (click)="goVendor()" aria-label="Join as Vendor">Join as Vendor</button>
          </div>
        </div>
      </section>

      <!-- TRUST -->
      <section class="section" id="trust">
        <div class="section__header" data-anim>
          <p class="section__eyebrow">Why Kairo</p>
          <h2 class="section__title">BUILT FOR TRUST AND CLARITY</h2>
        </div>
        <div class="trust-grid">
          @for (item of trustItems; track item.title) {
            <div class="trust-item" data-anim>
              <div class="trust-item__icon" [innerHTML]="item.icon"></div>
              <h3 class="trust-item__title">{{ item.title }}</h3>
              <p class="trust-item__desc">{{ item.desc }}</p>
            </div>
          }
        </div>
      </section>

      <!-- LOCATION PREVIEW -->
      <section class="section">
        <div class="section__header" data-anim>
          <p class="section__eyebrow">Nearby</p>
          <h2 class="section__title">VENDORS AROUND YOU</h2>
        </div>
        <div class="map-preview" data-anim>
          <div class="map-preview__bg">
            <svg class="map-preview__grid" viewBox="0 0 400 200" aria-hidden="true">
              @for (i of gridLines; track i) {
                <line [attr.x1]="i * 40" y1="0" [attr.x2]="i * 40" y2="200" stroke="#1a1a1a" stroke-width="0.5"/>
              }
              @for (i of gridLinesH; track i) {
                <line x1="0" [attr.y1]="i * 40" x2="400" [attr.y2]="i * 40" stroke="#1a1a1a" stroke-width="0.5"/>
              }
              <circle cx="200" cy="100" r="3" fill="#00bfa6"/>
              <circle cx="200" cy="100" r="20" fill="none" stroke="#00bfa6" stroke-width="0.5" opacity="0.4"/>
              <circle cx="200" cy="100" r="50" fill="none" stroke="#00bfa6" stroke-width="0.3" opacity="0.2"/>
              <circle cx="160" cy="80" r="2.5" fill="#00796b"/>
              <circle cx="240" cy="70" r="2.5" fill="#00796b"/>
              <circle cx="220" cy="130" r="2.5" fill="#00796b"/>
              <circle cx="170" cy="120" r="2.5" fill="#00796b"/>
            </svg>
          </div>
          <div class="map-preview__card">
            <p class="map-preview__label">4 vendors nearby</p>
            <p class="map-preview__hint">Plumbing, Electrical, Cleaning, AC Service</p>
            <button class="btn btn--primary btn--sm" (click)="goRegister()" aria-label="View Nearby">View Nearby</button>
          </div>
        </div>
      </section>

      <!-- FOOTER -->
      <footer class="footer">
        <div class="footer__inner">
          <div class="footer__grid">
            <div class="footer__brand">
              <p class="footer__logo">KAIRO</p>
              <p class="footer__mission">Empowering hyperlocal businesses. Making trusted local services seamless.</p>
            </div>
            <div class="footer__col">
              <h4>Product</h4>
              <a (click)="scrollTo('how')">How It Works</a>
              <a (click)="scrollTo('categories')">Categories</a>
              <a (click)="scrollTo('vendors')">For Vendors</a>
            </div>
            <div class="footer__col">
              <h4>Company</h4>
              <a>About</a>
              <a>Privacy</a>
              <a>Terms</a>
            </div>
            <div class="footer__col">
              <h4>Connect</h4>
              <a>Support</a>
              <a>Contact</a>
            </div>
          </div>
          <div class="footer__bottom">
            <span class="footer__version">v1.0.0-mvp</span>
            <span class="footer__copy">Kairo Services</span>
          </div>
        </div>
      </footer>
    </main>
  `,
    styles: [`
    /* ===== BASE ===== */
    :host {
      display: block; min-height: 100vh; background: #000; color: #e5e5e5;
      font-family: 'Inter', -apple-system, sans-serif;
      --grad: linear-gradient(90deg, #00bfa6, #00796b);
      --ease: cubic-bezier(0.22, 1, 0.36, 1);
    }
    *, *::before, *::after { box-sizing: border-box; }

    /* ===== NAVBAR ===== */
    .nav {
      position: fixed; top: 0; left: 0; right: 0; z-index: 100;
      background: rgba(0,0,0,0.6); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
      border-bottom: 1px solid rgba(255,255,255,0.04);
      transition: all 300ms var(--ease);
    }
    .nav.scrolled { background: rgba(0,0,0,0.92); }
    .nav__inner {
      max-width: 1120px; margin: 0 auto;
      display: flex; align-items: center; justify-content: space-between;
      padding: 18px 20px;
      transition: padding 300ms var(--ease);
    }
    .nav.compact .nav__inner { padding: 12px 20px; }
    .nav__logo {
      font-size: 20px; font-weight: 900; color: #fff; letter-spacing: 2px; cursor: pointer;
      text-decoration: none; position: relative;
    }
    .nav__logo::after {
      content: ''; position: absolute; bottom: -2px; left: 0; width: 100%; height: 2px;
      background: var(--grad); transform: scaleX(0); transition: transform 300ms var(--ease);
      transform-origin: left;
    }
    .nav__logo:hover::after { transform: scaleX(1); }
    .nav__links { display: none; gap: 24px; }
    .nav__links a {
      font-size: 13px; color: #888; cursor: pointer; text-transform: uppercase;
      letter-spacing: 0.5px; font-weight: 600; transition: color 200ms;
    }
    .nav__links a:hover { color: #fff; }
    .nav__cta {
      padding: 10px 20px; background: var(--grad); color: #000;
      border: none; border-radius: 8px; font-weight: 800; font-size: 12px;
      text-transform: uppercase; letter-spacing: 0.5px; cursor: pointer;
      transition: transform 140ms var(--ease), box-shadow 140ms var(--ease);
      min-height: 44px; font-family: inherit;
    }
    .nav__cta:active { transform: scale(0.97); }
    .nav__cta:hover { box-shadow: 0 4px 20px rgba(0,191,166,0.25); }
    @media (min-width: 768px) {
      .nav__links { display: flex; }
    }

    /* ===== PAGE ===== */
    .page { padding-top: 72px; }

    /* ===== HERO ===== */
    .hero {
      position: relative; overflow: hidden;
      padding: 48px 20px 56px; min-height: 85vh;
      display: flex; flex-direction: column; justify-content: center;
      max-width: 1120px; margin: 0 auto;
    }
    .hero__grid-bg {
      position: absolute; inset: 0; opacity: 0.04;
      background-image:
        linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px);
      background-size: 48px 48px;
      animation: gridDrift 20s linear infinite;
    }
    @keyframes gridDrift { to { background-position: 48px 48px; } }
    .hero__content { position: relative; z-index: 1; }
    .hero__eyebrow {
      text-transform: uppercase; letter-spacing: 2px; font-size: 11px;
      color: #00bfa6; font-weight: 700; margin: 0 0 16px;
    }
    .hero__title {
      font-size: clamp(36px, 8vw, 72px); font-weight: 900; line-height: 0.95;
      color: #fff; margin: 0 0 20px; letter-spacing: -0.03em;
    }
    .hero__sub {
      max-width: 520px; font-size: 15px; line-height: 1.6;
      color: #8a8f94; margin: 0 0 28px;
    }
    .hero__ctas { display: flex; gap: 12px; flex-wrap: wrap; }
    .hero__visual {
      display: none; position: relative; z-index: 1;
    }
    .hero__card {
      background: #0a0a0a; border: 1px solid #1f1f1f; border-radius: 12px;
      padding: 20px; max-width: 320px;
    }
    .hero__card-top { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
    .hero__card-avatar {
      width: 40px; height: 40px; border-radius: 8px; background: var(--grad);
      display: flex; align-items: center; justify-content: center;
      color: #000; font-weight: 900; font-size: 16px;
    }
    .hero__card-name { font-size: 14px; font-weight: 700; color: #fff; margin: 0; }
    .hero__card-cat { font-size: 11px; color: #666; margin: 2px 0 0; }
    .hero__card-badge {
      margin-left: auto; font-size: 9px; font-weight: 800; color: #00bfa6;
      border: 1px solid #00bfa6; padding: 2px 6px; border-radius: 4px; letter-spacing: 0.5px;
    }
    .hero__card-rating {
      font-size: 12px; color: #888; display: flex; align-items: center; gap: 4px;
      margin-bottom: 12px;
    }
    .hero__card-services { display: flex; gap: 6px; }
    .hero__card-services span {
      font-size: 11px; color: #666; background: #111; border: 1px solid #1f1f1f;
      padding: 4px 8px; border-radius: 4px;
    }
    @media (min-width: 768px) {
      .hero {
        flex-direction: row; align-items: center; gap: 48px;
        padding: 80px 20px;
      }
      .hero__content { flex: 1; }
      .hero__visual { display: block; flex-shrink: 0; }
    }

    /* ===== BUTTONS ===== */
    .btn {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 14px 24px; border-radius: 10px;
      font-weight: 800; font-size: 13px; text-transform: uppercase;
      letter-spacing: 0.5px; cursor: pointer; border: none;
      transition: transform 140ms var(--ease), box-shadow 140ms var(--ease);
      font-family: inherit; min-height: 48px;
    }
    .btn:active { transform: scale(0.97); }
    .btn:focus-visible { outline: 2px solid #00bfa6; outline-offset: 2px; }
    .btn--primary {
      background: var(--grad); color: #000;
    }
    .btn--primary:hover { box-shadow: 0 6px 24px rgba(0,191,166,0.3); }
    .btn--outline {
      background: transparent; color: #e5e5e5;
      border: 2px solid transparent;
      background-image: linear-gradient(#000, #000), var(--grad);
      background-origin: border-box; background-clip: padding-box, border-box;
    }
    .btn--outline:hover { box-shadow: 0 4px 20px rgba(0,191,166,0.15); }
    .btn--sm { padding: 10px 16px; font-size: 11px; min-height: 40px; border-radius: 8px; }
    .btn--shimmer { position: relative; overflow: hidden; }
    .btn--shimmer::after {
      content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent);
      animation: shimmerCta 6s ease-in-out infinite;
    }
    @keyframes shimmerCta {
      0%, 80%, 100% { left: -100%; }
      90% { left: 100%; }
    }
    @media (max-width: 480px) {
      .btn { width: 100%; justify-content: center; }
      .hero__ctas { flex-direction: column; }
    }

    /* ===== SECTIONS ===== */
    .section {
      padding: 64px 20px; max-width: 1120px; margin: 0 auto;
    }
    .section__header { margin-bottom: 40px; }
    .section__eyebrow {
      text-transform: uppercase; letter-spacing: 2px; font-size: 11px;
      color: #00bfa6; font-weight: 700; margin: 0 0 8px;
    }
    .section__title {
      font-size: clamp(24px, 5vw, 40px); font-weight: 900;
      color: #fff; letter-spacing: -0.02em; margin: 0; line-height: 1.1;
    }

    /* ===== HOW IT WORKS ===== */
    .steps {
      display: grid; gap: 16px;
      grid-template-columns: 1fr;
    }
    .step {
      background: #0a0a0a; border: 2px solid #1a1a1a; border-radius: 12px;
      padding: 24px; position: relative;
      transition: transform 200ms var(--ease), box-shadow 200ms var(--ease), border-color 200ms;
    }
    .step:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 32px rgba(0,0,0,0.5);
      border-color: #2a2a2a;
    }
    .step__num {
      position: absolute; top: 16px; right: 16px;
      font-size: 48px; font-weight: 900; color: #111; line-height: 1;
      font-family: 'Source Code Pro', monospace;
    }
    .step__icon { margin-bottom: 16px; color: #00bfa6; }
    .step__icon svg { width: 32px; height: 32px; }
    .step__title {
      font-size: 18px; font-weight: 800; color: #fff; margin: 0 0 8px;
      text-transform: uppercase; letter-spacing: 0.5px;
    }
    .step__desc { font-size: 14px; color: #777; line-height: 1.6; margin: 0; max-width: 320px; }
    @media (min-width: 768px) {
      .steps { grid-template-columns: repeat(3, 1fr); }
    }

    /* ===== CATEGORIES ===== */
    .cat-scroll {
      display: flex; gap: 12px; overflow-x: auto;
      scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch;
      padding-bottom: 8px;
      scrollbar-width: thin; scrollbar-color: #222 transparent;
    }
    .cat-scroll::-webkit-scrollbar { height: 4px; }
    .cat-scroll::-webkit-scrollbar-track { background: transparent; }
    .cat-scroll::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
    .cat-block {
      flex: 0 0 auto; scroll-snap-align: start;
      width: 140px; height: 100px;
      background: #0a0a0a; border: 2px solid #1a1a1a; border-radius: 10px;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 8px; cursor: pointer;
      transition: border-color 200ms var(--ease), transform 200ms var(--ease), box-shadow 200ms;
    }
    .cat-block:hover {
      border-color: #00bfa6; transform: translateY(-2px);
      box-shadow: 0 0 20px rgba(0,191,166,0.1);
    }
    .cat-block__icon { color: #00bfa6; }
    .cat-block__icon svg { width: 24px; height: 24px; }
    .cat-block__label {
      font-size: 12px; font-weight: 700; color: #aaa; text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    @media (min-width: 768px) {
      .cat-scroll {
        display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        overflow: visible;
      }
      .cat-block { width: auto; }
    }

    /* ===== VENDOR BAND ===== */
    .vendor-band {
      background: #060606; border-top: 1px solid #141414; border-bottom: 1px solid #141414;
      padding: 64px 20px;
    }
    .vendor-band__inner { max-width: 1120px; margin: 0 auto; }
    .vendor-band__desc {
      font-size: 15px; color: #777; line-height: 1.7; margin: 16px 0 32px;
      max-width: 560px;
    }
    .vendor-band__stats {
      display: flex; gap: 32px; flex-wrap: wrap; margin-bottom: 32px;
    }
    .stat { display: flex; flex-direction: column; }
    .stat__num {
      font-size: 32px; font-weight: 900; color: #00bfa6;
      font-family: 'Source Code Pro', monospace;
    }
    .stat__label { font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px; }

    /* ===== TRUST ===== */
    .trust-grid {
      display: grid; grid-template-columns: 1fr; gap: 16px;
    }
    .trust-item {
      display: flex; gap: 16px; align-items: flex-start;
      padding: 20px; background: #0a0a0a; border: 1px solid #1a1a1a;
      border-radius: 10px;
      transition: border-color 200ms, transform 200ms var(--ease);
    }
    .trust-item:hover { border-color: #222; transform: translateY(-2px); }
    .trust-item__icon { color: #00bfa6; flex-shrink: 0; margin-top: 2px; }
    .trust-item__icon svg { width: 20px; height: 20px; }
    .trust-item__title {
      font-size: 14px; font-weight: 800; color: #e5e5e5; margin: 0 0 4px;
      text-transform: uppercase; letter-spacing: 0.3px;
    }
    .trust-item__desc { font-size: 13px; color: #777; line-height: 1.5; margin: 0; }
    @media (min-width: 768px) {
      .trust-grid { grid-template-columns: repeat(2, 1fr); }
    }

    /* ===== MAP PREVIEW ===== */
    .map-preview {
      position: relative; background: #060606; border: 2px solid #1a1a1a;
      border-radius: 12px; overflow: hidden; min-height: 200px;
    }
    .map-preview__bg {
      width: 100%; display: flex; align-items: center; justify-content: center;
      padding: 20px;
    }
    .map-preview__grid { width: 100%; max-width: 400px; height: auto; }
    .map-preview__card {
      position: absolute; bottom: 16px; left: 16px; right: 16px;
      background: rgba(10,10,10,0.95); border: 1px solid #222;
      border-radius: 10px; padding: 16px;
      backdrop-filter: blur(8px);
    }
    .map-preview__label { font-size: 14px; font-weight: 700; color: #fff; margin: 0 0 4px; }
    .map-preview__hint { font-size: 12px; color: #666; margin: 0 0 12px; }

    /* ===== FOOTER ===== */
    .footer {
      border-top: 1px solid #141414; padding: 48px 20px 24px;
      background: #030303;
    }
    .footer__inner { max-width: 1120px; margin: 0 auto; }
    .footer__grid {
      display: grid; grid-template-columns: 1fr; gap: 32px;
      margin-bottom: 32px;
    }
    .footer__logo {
      font-size: 18px; font-weight: 900; color: #fff; letter-spacing: 2px; margin: 0 0 8px;
    }
    .footer__mission { font-size: 13px; color: #555; line-height: 1.6; margin: 0; max-width: 280px; }
    .footer__col h4 {
      font-size: 11px; font-weight: 700; color: #555; text-transform: uppercase;
      letter-spacing: 1px; margin: 0 0 12px;
    }
    .footer__col a {
      display: block; font-size: 13px; color: #777; margin-bottom: 8px;
      cursor: pointer; transition: color 200ms;
    }
    .footer__col a:hover { color: #bbb; }
    .footer__bottom {
      display: flex; justify-content: space-between; align-items: center;
      border-top: 1px solid #111; padding-top: 16px;
    }
    .footer__version {
      font-size: 11px; color: #333; font-family: 'Source Code Pro', monospace;
    }
    .footer__copy { font-size: 11px; color: #333; }
    @media (min-width: 768px) {
      .footer__grid { grid-template-columns: 2fr 1fr 1fr 1fr; }
    }

    /* ===== GRADIENT DIVIDERS ===== */
    .section + .section::before {
      content: ''; display: block;
      height: 1px; max-width: 200px; margin: 0 auto 64px;
      background: var(--grad); opacity: 0.2;
    }

    /* ===== ANIMATIONS ===== */
    [data-anim] {
      opacity: 0; transform: translateY(16px);
      transition: opacity 300ms var(--ease), transform 300ms var(--ease);
    }
    [data-anim].visible {
      opacity: 1; transform: translateY(0);
    }
    @media (prefers-reduced-motion: reduce) {
      [data-anim] { opacity: 1; transform: none; transition: none; }
      .hero__grid-bg { animation: none; }
      .btn--shimmer::after { animation: none; }
      @keyframes gridDrift { to { background-position: 0 0; } }
    }
  `],
})
export class LandingComponent implements OnInit, OnDestroy, AfterViewInit {
    scrolled = signal(false);
    navCompact = signal(false);
    private lastScrollY = 0;
    private observer?: IntersectionObserver;
    private countersAnimated = false;

    steps = [
        {
            num: '01', title: 'Discover',
            desc: 'Browse verified local vendors by category, ratings, and proximity. Find the right pro in seconds.',
            icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>',
        },
        {
            num: '02', title: 'Book',
            desc: 'Pick date, time, address. See transparent pricing upfront. Confirm with one tap.',
            icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
        },
        {
            num: '03', title: 'Get It Done',
            desc: 'Track arrival in real-time. Verify with OTP. Pay securely. Rate your experience.',
            icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
        },
    ];

    serviceCategories = [
        { name: 'Plumbing', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 12h4m0 0V4.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5V12m-4 0h4m2 0h2a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h2"/></svg>' },
        { name: 'Electrical', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>' },
        { name: 'Cleaning', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18M5 21V7l7-4 7 4v14"/><path d="M9 21v-4h6v4"/></svg>' },
        { name: 'Carpentry', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M12 6v12M2 12h20"/></svg>' },
        { name: 'Painting', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 3H5a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z"/><path d="M12 9v7"/><path d="M8 16h8l-4 5-4-5z"/></svg>' },
        { name: 'AC Service', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="10" rx="2"/><path d="M6 17v2m4-2v4m4-4v2m4-2v4"/></svg>' },
        { name: 'Pest Control', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v4m0 14v4M4.22 4.22l2.83 2.83m9.9 9.9l2.83 2.83M1 12h4m14 0h4M4.22 19.78l2.83-2.83m9.9-9.9l2.83-2.83"/></svg>' },
        { name: 'Appliances', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2"/><circle cx="12" cy="14" r="3"/><line x1="12" y1="6" x2="12" y2="6.01"/></svg>' },
    ];

    trustItems = [
        {
            title: 'KYC Verified Vendors',
            desc: 'Every vendor goes through document verification before they can accept bookings.',
            icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
        },
        {
            title: 'Transparent Pricing',
            desc: 'See service rates upfront. No hidden charges. Final price confirmed before completion.',
            icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
        },
        {
            title: 'Real-Time Tracking',
            desc: 'Live status updates and in-app chat. Know exactly when your vendor arrives.',
            icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
        },
        {
            title: 'Local Empowerment',
            desc: 'Built for neighbourhood businesses. No middlemen, no national competition.',
            icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
        },
    ];

    gridLines = Array.from({ length: 11 }, (_, i) => i);
    gridLinesH = Array.from({ length: 6 }, (_, i) => i);

    constructor(private router: Router, private auth: AuthService) { }

    ngOnInit() {
        if (this.auth.isLoggedIn && this.auth.currentUser) {
            this.redirectByRole();
        } else {
            this.auth.currentUser$.subscribe(user => {
                if (user) this.redirectByRole();
            });
        }
    }

    ngAfterViewInit() {
        this.setupIntersectionObserver();
    }

    ngOnDestroy() {
        this.observer?.disconnect();
    }

    @HostListener('window:scroll')
    onScroll() {
        const y = window.scrollY;
        this.scrolled.set(y > 20);
        this.navCompact.set(y > this.lastScrollY && y > 100);
        this.lastScrollY = y;
    }

    private redirectByRole() {
        const role = this.auth.currentUser?.role;
        if (role === 'vendor') this.router.navigate(['/vendor']);
        else if (role === 'admin') this.router.navigate(['/admin']);
        else this.router.navigate(['/home']);
    }

    goLogin() { this.router.navigate(['/auth/login']); }
    goRegister() { this.router.navigate(['/auth/register']); }
    goVendor() { this.router.navigate(['/auth/register'], { queryParams: { role: 'vendor' } }); }

    scrollTop() { window.scrollTo({ top: 0, behavior: 'smooth' }); }

    scrollTo(id: string) {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    private setupIntersectionObserver() {
        if (typeof IntersectionObserver === 'undefined') return;

        this.observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');

                        const statEl = entry.target.querySelector('.stat__num');
                        if (statEl && !this.countersAnimated) {
                            this.countersAnimated = true;
                            this.animateCounters();
                        }
                    }
                });
            },
            { threshold: 0.15 }
        );

        document.querySelectorAll('[data-anim]').forEach((el) => {
            this.observer!.observe(el);
        });
    }

    private animateCounters() {
        document.querySelectorAll('.stat__num').forEach((el) => {
            const target = parseInt(el.getAttribute('data-target') || '0', 10);
            const duration = 1200;
            const start = performance.now();
            const tick = (now: number) => {
                const elapsed = now - start;
                const progress = Math.min(elapsed / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                el.textContent = Math.round(eased * target) + '+';
                if (progress < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
        });
    }
}
