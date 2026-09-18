/* ============================================================
   NKENNE: Shared site behavior. Loaded on every page.
   Every block guards for element existence so this one file
   works unmodified across Home, Languages, LiiVE, TRiiBE,
   Blog, About, and Download.
   ============================================================ */
(function () {
    if (window.lucide) lucide.createIcons();

    // ---- Watchdog: whatever else goes wrong (GSAP CDN blocked, ScrollTrigger
    // failed to register, an unrelated script error), never leave content
    // permanently stuck at its animate-in starting opacity of 0. ----
    setTimeout(() => {
        document.querySelectorAll('.reveal, .hero-eyebrow, .page-eyebrow, .hero h1 .line span, .hero-subtitle, .hero-greet, .page-hero .lede, .hero-cta, .page-hero .btn-group, .hero-scroll').forEach(el => {
            if (getComputedStyle(el).opacity === '0') {
                el.style.opacity = '1';
                el.style.transform = 'none';
            }
        });
    }, 3500);

    // ---- Nav: solid-on-scroll + mobile toggle ----
    const nav = document.querySelector('.site-nav');
    if (nav) {
        const solidAt = 60;
        const setNavState = () => {
            if (window.scrollY > solidAt) {
                nav.classList.add('is-solid');
                nav.classList.remove('is-transparent');
            } else if (nav.dataset.style !== 'always-solid') {
                nav.classList.remove('is-solid');
                nav.classList.add('is-transparent');
            }
        };
        if (nav.dataset.style === 'always-solid') nav.classList.add('is-solid');
        else { setNavState(); window.addEventListener('scroll', setNavState, { passive: true }); }

        const menuBtn = document.querySelector('.menu-btn');
        if (menuBtn) {
            menuBtn.addEventListener('click', () => {
                document.body.classList.toggle('menu-open');
                const expanded = document.body.classList.contains('menu-open');
                menuBtn.setAttribute('aria-expanded', String(expanded));
            });
            document.querySelectorAll('.mobile-panel a').forEach(a => {
                a.addEventListener('click', () => document.body.classList.remove('menu-open'));
            });
        }
    }

    // ---- Custom cursor (desktop, fine pointer only) ----
    if (window.matchMedia('(pointer: fine)').matches) {
        const cursor = document.querySelector('.cursor');
        if (cursor) {
            let cursorShown = false;
            document.addEventListener('mousemove', (e) => {
                cursor.style.left = e.clientX - 10 + 'px';
                cursor.style.top = e.clientY - 10 + 'px';
                if (!cursorShown) { cursor.style.opacity = '1'; cursorShown = true; }
            });
            document.querySelectorAll('a, button, .stack-card-cta, .feature-card, .lang-card').forEach(el => {
                el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
                el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
            });
        }
    }

    // ---- Analytics (inert until real IDs are set) ----
    // Drop a real GA4 Measurement ID / Meta Pixel ID in here to turn tracking on.
    // Until then this loads nothing and trackEvent() is a silent no-op.
    const ANALYTICS = {
        ga4: null,       // e.g. 'G-XXXXXXXXXX'
        metaPixel: null  // e.g. '000000000000000'
    };
    if (ANALYTICS.ga4) {
        const gaScript = document.createElement('script');
        gaScript.async = true;
        gaScript.src = 'https://www.googletagmanager.com/gtag/js?id=' + ANALYTICS.ga4;
        document.head.appendChild(gaScript);
        window.dataLayer = window.dataLayer || [];
        window.gtag = function () { dataLayer.push(arguments); };
        gtag('js', new Date());
        gtag('config', ANALYTICS.ga4);
    }
    if (ANALYTICS.metaPixel) {
        (function (f, b, e, v, n, t, s) {
            if (f.fbq) return; n = f.fbq = function () {
                n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
            };
            if (!f._fbq) f._fbq = n; n.push = n; n.loaded = true; n.version = '2.0'; n.queue = [];
            t = b.createElement(e); t.async = true; t.src = v;
            s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
        })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
        window.fbq('init', ANALYTICS.metaPixel);
        window.fbq('track', 'PageView');
    }
    function trackEvent(name, params) {
        try {
            if (window.gtag) window.gtag('event', name, params || {});
            if (window.fbq) window.fbq('trackCustom', name, params || {});
        } catch (err) { /* analytics must never break the page */ }
    }

    // ---- Store badge click tracking (every "Download on the App Store" /
    // "Get it on Google Play" button, site-wide) ----
    document.querySelectorAll('.store-badge').forEach(a => {
        a.addEventListener('click', () => {
            const store = /apple\.com/.test(a.href) ? 'ios' : /play\.google/.test(a.href) ? 'android' : 'unknown';
            trackEvent('app_store_click', { store, page: location.pathname });
        });
    });

    // ---- Sticky mobile "Get the app" bar ----
    const stickyCta = document.getElementById('stickyCta');
    if (stickyCta) {
        const stickyBtn = document.getElementById('stickyCtaBtn');
        const stickyClose = document.getElementById('stickyCtaClose');
        const IOS_URL = 'https://apps.apple.com/us/app/nkenne/id1587537473';
        const ANDROID_URL = 'https://play.google.com/store/apps/details?gl=us&id=com.triaxo.nkenne';
        const ua = navigator.userAgent || '';
        const isIOS = /iPhone|iPad|iPod/i.test(ua);
        const isAndroid = /Android/i.test(ua);
        const onDownloadPage = /\/download$/.test(location.pathname);

        if (stickyBtn) {
            if (isIOS) stickyBtn.href = IOS_URL;
            else if (isAndroid) stickyBtn.href = ANDROID_URL;
            else stickyBtn.href = onDownloadPage ? '#storeBadges' : 'download#storeBadges';
            stickyBtn.addEventListener('click', () => trackEvent('sticky_cta_click', { page: location.pathname }));
        }

        let dismissed = false;
        try { dismissed = sessionStorage.getItem('nkenne_sticky_dismissed') === '1'; } catch (err) { /* private mode: just show it */ }

        if (!dismissed) {
            let nearBadges = false;
            let nearFooter = false;
            const updateVisibility = () => {
                const pastHero = window.scrollY > 500;
                stickyCta.classList.toggle('is-visible', pastHero && !nearBadges && !nearFooter);
            };

            const storeBadgesEl = document.getElementById('storeBadges');
            if (storeBadgesEl && window.IntersectionObserver) {
                new IntersectionObserver(entries => {
                    nearBadges = entries[0].isIntersecting;
                    updateVisibility();
                }, { threshold: 0.2 }).observe(storeBadgesEl);
            }
            const footerEl = document.querySelector('.site-footer');
            if (footerEl && window.IntersectionObserver) {
                new IntersectionObserver(entries => {
                    nearFooter = entries[0].isIntersecting;
                    updateVisibility();
                }, { threshold: 0 }).observe(footerEl);
            }
            window.addEventListener('scroll', updateVisibility, { passive: true });
            updateVisibility();
        }

        if (stickyClose) {
            stickyClose.addEventListener('click', () => {
                stickyCta.classList.remove('is-visible');
                try { sessionStorage.setItem('nkenne_sticky_dismissed', '1'); } catch (err) { /* nothing to persist, not fatal */ }
            });
        }
    }

    // ---- Smooth in-page anchor scroll ----
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href.length < 2) return;
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // ---- GSAP: reveal-on-scroll + hero + stacking cards ----
    // Wrapped in try/catch so a CDN hiccup (e.g. ScrollTrigger failed to load
    // while gsap.min.js succeeded) can't take down the FAQ accordion below it.
    try {
    if (window.gsap) {
        gsap.registerPlugin(ScrollTrigger);
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (!reduceMotion) {
            // Generic reveal utility: <el class="reveal"> fades/rises into view.
            gsap.utils.toArray('.reveal').forEach((el, i) => {
                gsap.to(el, {
                    opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
                    delay: (i % 6) * 0.06,
                    scrollTrigger: { trigger: el, start: 'top 88%' }
                });
            });

            // Hero cinematic entrance (Home + page-hero elements)
            gsap.utils.toArray('.hero-eyebrow, .page-eyebrow').forEach(el =>
                gsap.to(el, { opacity: 1, y: 0, duration: 1, delay: 0.4, ease: 'power3.out' }));
            gsap.utils.toArray('.hero h1 .line span').forEach((el, i) =>
                gsap.to(el, { y: 0, duration: 1.1, delay: 0.6 + i * 0.15, ease: 'power3.out' }));
            gsap.utils.toArray('.hero-subtitle, .hero-greet, .page-hero .lede').forEach(el =>
                gsap.to(el, { opacity: 1, y: 0, duration: 1, delay: 1.2, ease: 'power3.out' }));
            gsap.utils.toArray('.hero-cta, .page-hero .btn-group').forEach(el =>
                gsap.to(el, { opacity: 1, y: 0, duration: 1, delay: 1.5, ease: 'power3.out' }));
            gsap.utils.toArray('.hero-scroll').forEach(el =>
                gsap.to(el, { opacity: 1, duration: 1, delay: 1.9 }));

            // Parallax hero background word
            gsap.utils.toArray('.hero-bg-text').forEach(el => {
                gsap.to(el, {
                    scrollTrigger: { trigger: el.closest('section'), start: 'top top', end: 'bottom top', scrub: 1 },
                    x: 200, ease: 'none'
                });
            });

            // Stat counters
            gsap.utils.toArray('.stat-row').forEach(row => {
                gsap.from(row.querySelectorAll('.stat-count'), {
                    scrollTrigger: { trigger: row, start: 'top 85%' },
                    textContent: 0, duration: 1.8, ease: 'power1.out',
                    snap: { textContent: 1 }, stagger: 0.15
                });
            });

            // Stacking language cards (Languages page)
            const stackCards = gsap.utils.toArray('.stack-card');
            stackCards.forEach((card, i) => {
                const container = card.closest('.stack-container');
                ScrollTrigger.create({
                    trigger: container, start: 'top top', end: 'bottom top',
                    pin: true, pinSpacing: false, scrub: true,
                    onUpdate: (self) => {
                        if (i < stackCards.length - 1) {
                            gsap.to(card, {
                                scale: 1 - self.progress * 0.1,
                                filter: `blur(${self.progress * 20}px)`,
                                opacity: 1 - self.progress * 0.5,
                                duration: 0.1, ease: 'none'
                            });
                        }
                    }
                });
            });

            // Story scrollytelling pin (Home page "The Moment" section).
            // Default CSS shows every line stacked and readable with no JS;
            // this only layers a pinned crossfade on top when it can run.
            const storyWrap = document.querySelector('.story-pin-wrap');
            if (storyWrap) {
                const storyLines = gsap.utils.toArray('.story-line', storyWrap);
                if (storyLines.length > 1) {
                    storyWrap.classList.add('js-enhanced');
                    storyLines.forEach((l, i) => { l.style.opacity = i === 0 ? '1' : '0'; });
                    ScrollTrigger.create({
                        trigger: storyWrap, start: 'top top', end: '+=' + (storyLines.length * 100) + '%',
                        pin: '.story-pin-inner', scrub: true,
                        onUpdate: (self) => {
                            const seg = 1 / storyLines.length;
                            const idx = Math.min(storyLines.length - 1, Math.floor(self.progress / seg));
                            storyLines.forEach((l, i) => {
                                l.style.opacity = i === idx ? '1' : '0';
                                l.style.transform = i === idx ? 'translateY(0)' : (i < idx ? 'translateY(-24px)' : 'translateY(24px)');
                            });
                        }
                    });
                }
            }
        } else {
            gsap.set('.reveal, .hero-eyebrow, .page-eyebrow, .hero h1 .line span, .hero-subtitle, .hero-greet, .page-hero .lede, .hero-cta, .page-hero .btn-group, .hero-scroll', { opacity: 1, y: 0 });
        }
    } else {
        // GSAP CDN failed to load (offline, blocked, ad-blocker): force everything
        // visible rather than leaving it stuck at the CSS opacity:0 starting state.
        document.querySelectorAll('.reveal, .hero-eyebrow, .page-eyebrow, .hero h1 .line span, .hero-subtitle, .hero-greet, .page-hero .lede, .hero-cta, .page-hero .btn-group, .hero-scroll').forEach(el => {
            el.style.opacity = '1';
            el.style.transform = 'none';
        });
    }
    } catch (err) {
        document.querySelectorAll('.reveal, .hero-eyebrow, .page-eyebrow, .hero h1 .line span, .hero-subtitle, .hero-greet, .page-hero .lede, .hero-cta, .page-hero .btn-group, .hero-scroll').forEach(el => {
            el.style.opacity = '1';
            el.style.transform = 'none';
        });
    }

    // ---- FAQ accordion ----
    document.querySelectorAll('.faq-item').forEach(item => {
        const q = item.querySelector('.faq-q');
        const a = item.querySelector('.faq-a');
        if (!q || !a) return;
        q.setAttribute('aria-expanded', 'false');
        q.addEventListener('click', () => {
            const isOpen = item.classList.contains('open');
            document.querySelectorAll('.faq-item.open').forEach(other => {
                if (other !== item) {
                    other.classList.remove('open');
                    other.querySelector('.faq-a').style.maxHeight = null;
                    other.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
                }
            });
            item.classList.toggle('open', !isOpen);
            q.setAttribute('aria-expanded', String(!isOpen));
            a.style.maxHeight = !isOpen ? a.scrollHeight + 'px' : null;
        });
    });

    // ---- Hero greeting cycler ----
    const greetWord = document.getElementById('heroGreetWord');
    if (greetWord) {
        const words = ['Ndewo', 'Bawo ni', 'Sannu', 'Habari', 'Iska warran?', 'Nanga def', 'Sawubona', 'Maakye', 'Selam', 'Mhoro', 'Muraho', 'Mbote', 'How far', 'Bonjour', 'Olá', 'Bonjou'];
        let gi = 0;
        setInterval(() => {
            greetWord.classList.add('swap');
            setTimeout(() => {
                gi = (gi + 1) % words.length;
                greetWord.textContent = words[gi];
                greetWord.classList.remove('swap');
            }, 250);
        }, 2200);
    }

    // ---- Blog archive: category filter + pagination ----
    const blogFilterBar = document.getElementById('blogFilter');
    const blogGrid = document.getElementById('blogGrid');
    const blogPagination = document.getElementById('blogPagination');
    if (blogFilterBar && blogGrid) {
        const PAGE_SIZE = 6;
        const blogCards = Array.from(blogGrid.querySelectorAll('.blog-card'));
        let activeCategory = 'all';
        let activePage = 1;

        function renderBlog() {
            const filtered = blogCards.filter(c => activeCategory === 'all' || c.dataset.category === activeCategory);
            const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
            if (activePage > totalPages) activePage = 1;
            blogCards.forEach(c => { c.hidden = true; });
            filtered.forEach((c, i) => {
                if (Math.floor(i / PAGE_SIZE) + 1 === activePage) c.hidden = false;
            });
            if (blogPagination) {
                blogPagination.innerHTML = '';
                if (totalPages > 1) {
                    for (let p = 1; p <= totalPages; p++) {
                        const btn = document.createElement('button');
                        btn.className = 'blog-page-btn' + (p === activePage ? ' active' : '');
                        btn.type = 'button';
                        btn.textContent = String(p);
                        btn.addEventListener('click', () => { activePage = p; renderBlog(); });
                        blogPagination.appendChild(btn);
                    }
                }
            }
        }
        blogFilterBar.querySelectorAll('.blog-filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                blogFilterBar.querySelectorAll('.blog-filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                activeCategory = btn.dataset.filter;
                activePage = 1;
                renderBlog();
            });
        });
        renderBlog();
    }

    // ---- Find Your Language quiz ----
    const LANG_DATA = {
        igbo: { name: 'Igbo', phrase: 'Ndewo', meaning: '"Hello" in Igbo', copy: 'The tongue of the Nri Kingdom and Achebe’s proverbs, carrying market wisdom and ancestral memory, still spoken by millions.' },
        yoruba: { name: 'Yoruba', phrase: 'Bawo ni', meaning: '"Hello, how are you" in Yoruba', copy: 'Talking drums and oríkì praise poetry. A tonal language where pitch carries as much meaning as the words.' },
        hausa: { name: 'Hausa', phrase: 'Sannu', meaning: '"Hello" in Hausa', copy: 'West Africa’s great lingua franca, spoken from Kano to Accra by 80 million voices.' },
        pidgin: { name: 'Nigerian Pidgin', phrase: 'How far', meaning: '"Hello, how’s it going" in Nigerian Pidgin', copy: 'The people’s tongue: Nollywood, Afrobeats, and street-smart wit, all in one language.' },
        wolof: { name: 'Wolof', phrase: 'Nanga def', meaning: 'the everyday Wolof greeting', copy: 'The language of teranga, hospitality itself, spoken in the streets of Dakar.' },
        twi: { name: 'Twi', phrase: 'Maakye', meaning: 'the everyday Twi morning greeting', copy: 'The language of the Akan people, of Adinkra symbols and proverbs wise enough to travel the world.' },
        swahili: { name: 'Swahili', phrase: 'Habari', meaning: 'how people actually greet each other in Swahili: "what’s the news"', copy: 'A Bantu soul with Arabic whispers, spoken from Mogadishu to Mozambique.' },
        somali: { name: 'Somali', phrase: 'Iska warran?', meaning: 'the everyday Somali greeting: "tell me the news"', copy: 'The tongue of nomadic poets and maritime traders. Striking rhythm, striking precision.' },
        amharic: { name: 'Amharic', phrase: 'Selam', meaning: '"Hello / peace" in Amharic', copy: 'The language of emperors and an ancient script all its own, spoken by 32 million people.' },
        zulu: { name: 'Zulu', phrase: 'Sawubona', meaning: 'literally "I see you" in Zulu', copy: 'The language of clicks and kings, carrying the voice of 12 million speakers.' },
        shona: { name: 'Shona', phrase: 'Mhoro', meaning: '"Hello" in Shona', copy: 'Great Zimbabwe’s stone ruins and mbira music that speaks straight to ancestors.' },
        lingala: { name: 'Lingala', phrase: 'Mbote', meaning: '"Hello" in Lingala', copy: 'The language of rhythm and Kinshasa nights, carrying the pulse of Central Africa. Lingala is Premium-exclusive.', premium: true },
        kinyarwanda: { name: 'Kinyarwanda', phrase: 'Muraho', meaning: '"Hello" in Kinyarwanda', copy: 'The language of a thousand hills, where every greeting carries deep respect.' },
        french: { name: 'French', phrase: 'Bonjour', meaning: '"Hello" in French', copy: 'Not Parisian French. This is Abidjan’s maquis and Dakar’s rap scene.' },
        portuguese: { name: 'Portuguese', phrase: 'Olá', meaning: '"Hello" in Portuguese', copy: 'Shaped by Bantu rhythm and creole creativity across five African nations.' },
        haitian: { name: 'Haitian Creole', phrase: 'Bonjou', meaning: '"Hello" in Haitian Creole', copy: 'Born from West and Central African languages carried across the Atlantic, proof that heritage survives the crossing. Haitian Creole is Premium-exclusive.', premium: true }
    };
    // Regions with only one language skip the second question entirely
    // and go straight to the result, instead of asking a fake choice.
    const SINGLE_REGION_LANG = { east_africa: 'swahili', diaspora: 'haitian' };
    const quiz = document.getElementById('langQuiz');
    if (quiz) {
        const steps = quiz.querySelectorAll('.quiz-step');
        const resultStep = quiz.querySelector('.quiz-result');
        const progress = quiz.querySelectorAll('.quiz-progress span');
        const variants = quiz.querySelectorAll('.quiz-variant');

        function showQuizStep(n) {
            steps.forEach(s => { s.hidden = Number(s.dataset.step) !== n; });
            if (resultStep) resultStep.hidden = n !== 3;
            progress.forEach((p, i) => p.classList.toggle('active', i < n));
        }

        function showResult(langKey) {
            const data = LANG_DATA[langKey];
            if (!data) return;
            const nameEl = document.getElementById('quizLangName');
            const phraseEl = document.getElementById('quizLangPhrase');
            const copyEl = document.getElementById('quizLangCopy');
            const ctaEl = document.getElementById('quizLangCta');
            if (nameEl) nameEl.textContent = data.name;
            if (phraseEl) phraseEl.textContent = '“' + data.phrase + '”, ' + data.meaning;
            if (copyEl) copyEl.textContent = data.copy;
            if (ctaEl) {
                ctaEl.childNodes[0].textContent = data.premium ? 'Unlock with Premium' : 'Start free';
            }
            trackEvent('quiz_result', { language: langKey, premium: !!data.premium });
            showQuizStep(3);
        }

        quiz.querySelectorAll('[data-question="region"] .quiz-opt').forEach(btn => {
            btn.addEventListener('click', () => {
                const region = btn.dataset.value;
                if (SINGLE_REGION_LANG[region]) { showResult(SINGLE_REGION_LANG[region]); return; }
                variants.forEach(v => { v.hidden = v.dataset.region !== region; });
                showQuizStep(2);
            });
        });

        quiz.querySelectorAll('.quiz-variant .quiz-opt').forEach(btn => {
            btn.addEventListener('click', () => showResult(btn.dataset.lang));
        });

        quiz.querySelectorAll('.quiz-back').forEach(btn => btn.addEventListener('click', () => showQuizStep(1)));
        const restartBtn = document.getElementById('quizRestart');
        if (restartBtn) restartBtn.addEventListener('click', () => showQuizStep(1));
    }
})();
