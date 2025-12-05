(()=>{
	if(document.__yolomode) return;
	document.__yolomode = true;

	// === Check if preloading should be enabled ===
	const isSmallScreen = document.documentElement.clientWidth * document.documentElement.clientHeight < 450000;
	const conn = navigator.connection;
	const isSaveData = conn?.saveData;
	const isSlow = conn?.effectiveType?.includes('2g');
	const yoloEnabled = !(isSmallScreen && (isSaveData || isSlow));

	if (!yoloEnabled) return;

	// === Helpers ===
	let attr = (elt, name, defaultVal)=>elt.getAttribute(name) || defaultVal;
	let isBoosted = (el)=>!el.closest('[fx-boost="false"]');

	// === Preloading infrastructure ===
	const supportsSpeculationRules = HTMLScriptElement.supports && HTMLScriptElement.supports('speculationrules');
	const prefetchedUrls = new Set();
	const prerenderedUrls = new Set();

	// Not supported in Safari as of 2025-12
	function prefetchWithLink(url) {
		const link = document.createElement('link');
		link.rel = 'prefetch';
		link.href = url;
		document.head.appendChild(link);
	}

	// Only Chrome and Edge support as of 2025-12
	function prerenderWithSpeculationRules(url) {
		const script = document.createElement('script');
		script.type = 'speculationrules';
		script.textContent = JSON.stringify({
			prerender: [{ source: 'list', urls: [url] }]
		});
		document.head.appendChild(script);
	}

	// Widely supported but aggressive
	function prerenderWithIframe(url) {
		const iframe = document.createElement('iframe');
		const viewportWidth = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
		const viewportHeight = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
		iframe.style.cssText = [
			'position: fixed;',
			'top: -10000px;',
			'left: -10000px;',
			`width: ${viewportWidth}px;`,
			`height: ${viewportHeight}px;`,
			'pointer-events: none;',
		].join('');
		iframe.src = url;
		iframe.sandbox = 'allow-same-origin';
		iframe.setAttribute('aria-hidden', 'true');
		iframe.tabIndex = -1;
		document.body.appendChild(iframe);

		// Clean up after a while to avoid accumulating iframes
		setTimeout(() => iframe.remove(), 10000);
	}

	function prefetch(url, boosted) {
		if (prefetchedUrls.has(url)) return;
		prefetchedUrls.add(url);
		// Boosted links use fetch(), so we must prefetch with fetch() to share the cache.
		if (boosted) {
			fetch(url).catch(() => {});
		} else {
			prefetchWithLink(url);
		}
	}

	function prerender(url, boosted) {
		if (prerenderedUrls.has(url)) return;
		prerenderedUrls.add(url);
		if (supportsSpeculationRules) {
			prerenderWithSpeculationRules(url);
		} else {
			// Iframe prerendering uses document cache,
			// so for boosted links/forms we also use fetch
			if (boosted) fetch(url).catch(() => {});
			prerenderWithIframe(url);
		}
	}

	function startPreload(elt) {
		if (elt.__yolo_preloaded) return;
		elt.__yolo_preloaded = true;
		const method = attr(elt, "fx-method", "GET").toUpperCase();
		if (method !== 'GET') return;
		const url = attr(elt, "fx-action") || elt.href;
		const parsedUrl = new URL(url, location.href);
		if (!url || parsedUrl.origin + parsedUrl.pathname + parsedUrl.search === location.origin + location.pathname + location.search) return;
		const isBoostedLink = elt.matches('a[href^="/"]') && !elt.hasAttribute('fx-action') && isBoosted(elt);

		if (elt.hasAttribute('fx-yolo-deep')) {
			prerender(url, isBoostedLink);
		} else {
			prefetch(url, isBoostedLink);
		}
	}

	const timerMap = new WeakMap();
	const yoloSelector = '[fx-yolo], [fx-yolo-deep]';

	document.addEventListener('mouseover', (e) => {
		const elt = e.target?.closest?.(yoloSelector);
		if (!elt || elt.__yolo_preloaded || timerMap.has(elt)) return;
		timerMap.set(elt, setTimeout(() => {
			startPreload(elt);
			timerMap.delete(elt);
		}, 65));
	}, true);

	document.addEventListener('mouseout', (e) => {
		const elt = e.target?.closest?.(yoloSelector);
		if (elt && timerMap.has(elt)) {
			clearTimeout(timerMap.get(elt));
			timerMap.delete(elt);
		}
	}, true);

	document.addEventListener('touchstart', (e) => {
		const elt = e.target?.closest?.(yoloSelector);
		if (elt) startPreload(elt);
	}, {passive: true});

	console.log("🏄‍♂️ YOLO Mode Engaged 🏄‍♂️");
})();
