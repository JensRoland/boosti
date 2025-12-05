(()=>{
	if(document.__boosti) return;
	document.__boosti = true;

	// === FIXI CORE ===
	let defined = document.__fixi_mo;
	if (!defined) {
		document.__fixi_mo = new MutationObserver((recs)=>recs.forEach((r)=>r.type === "childList" && r.addedNodes.forEach((n)=>process(n))));
	}
	let send = (elt, type, detail, bub)=>elt.dispatchEvent(new CustomEvent("fx:" + type, {detail, cancelable:true, bubbles:bub !== false, composed:true}));
	let attr = (elt, name, defaultVal)=>elt.getAttribute(name) || defaultVal;
	let ignore = (elt)=>elt.closest("[fx-ignore]") != null;

	// === BOOSTI: Trigger parsing with modifiers ===
	let parseTriggers = (str)=>str.split(/\s*,\s*/).map(part=>{
		let tokens = part.trim().split(/\s+/), spec = {evt: tokens[0]};
		for (let i = 1; i < tokens.length; i++) {
			let t = tokens[i];
			if (t === "changed") spec.changed = true;
			else if (t === "once") spec.once = true;
			else if (t.startsWith("delay:")) spec.delay = parseInt(t.slice(6));
			else if (t.startsWith("throttle:")) spec.throttle = parseInt(t.slice(9));
			else if (t.startsWith("threshold:")) spec.threshold = parseFloat(t.slice(10));
		}
		return spec;
	});

	let wrapHandler = (handler, spec, elt)=>{
		let lastVal = spec.changed ? elt.value : undefined, timer, lastRun = 0;
		return (evt)=>{
			if (spec.changed) {
				let val = elt.value;
				if (val === lastVal) return;
				lastVal = val;
			}
			let run = ()=>handler(evt);
			if (spec.throttle) {
				let now = Date.now(), wait = spec.throttle - (now - lastRun);
				if (wait <= 0) { lastRun = now; run(); }
				else if (!timer) timer = setTimeout(()=>{ timer = null; lastRun = Date.now(); run(); }, wait);
			} else if (spec.delay) {
				clearTimeout(timer);
				timer = setTimeout(run, spec.delay);
			} else run();
		};
	};

	let init = (elt)=>{
		let options = {};
		if (elt.__fixi || ignore(elt) || !send(elt, "init", {options})) return;
		elt.__fixi = async(evt)=>{
			let reqs = elt.__fixi.requests ||= new Set();
			let form = elt.form || elt.closest("form");
			let body = new FormData(form ?? undefined, evt.submitter);
			if (!form && elt.name) body.append(elt.name, elt.value);
			let ac = new AbortController();
			let cfg = {
				trigger:evt,
				action:attr(elt, "fx-action"),
				method:attr(elt, "fx-method", "GET").toUpperCase(),
				target:document.querySelector(attr(elt, "fx-target")) ?? elt,
				swap:attr(elt, "fx-swap", "outerHTML"),
				body,
				drop:reqs.size,
				headers:{"FX-Request":"true"},
				abort:ac.abort.bind(ac),
				signal:ac.signal,
				preventTrigger:true,
				transition:document.startViewTransition?.bind(document),
				fetch:fetch.bind(window)
			};

			// === BOOSTI: fx-confirm ===
			let confirmMsg = elt.getAttribute("fx-confirm");
			if (confirmMsg) {
				cfg.confirm = () => Promise.resolve(confirm(confirmMsg));
			}

			let go = send(elt, "config", {cfg, requests:reqs});
			if (cfg.preventTrigger) evt.preventDefault();
			if (!go || cfg.drop) return;
			if (/GET|DELETE/.test(cfg.method)){
				let params = new URLSearchParams(cfg.body);
				if (params.size)
					cfg.action += (/\?/.test(cfg.action) ? "&" : "?") + params;
				cfg.body = null;
			}
			reqs.add(cfg);
			let indicator = document.querySelector(attr(elt, "fx-indicator"));
			if (indicator) indicator.classList.add("fx-request");
			try {
				if (cfg.confirm){
					let result = await cfg.confirm();
					if (!result) return;
				}
				if (!send(elt, "before", {cfg, requests:reqs})) return;
				cfg.response = await cfg.fetch(cfg.action, cfg);
				cfg.text = await cfg.response.text();
				if (!send(elt, "after", {cfg})) return;
			} catch(error) {
				send(elt, "error", {cfg, error});
				return;
			} finally {
				reqs.delete(cfg);
				if (indicator) indicator.classList.remove("fx-request");
				send(elt, "finally", {cfg});
			}
			let doSwap = ()=>{
				if (cfg.swap instanceof Function)
					return cfg.swap(cfg);
				else if (/(before|after)(begin|end)/.test(cfg.swap))
					cfg.target.insertAdjacentHTML(cfg.swap, cfg.text);
				else if(cfg.swap in cfg.target)
					cfg.target[cfg.swap] = cfg.text;
				else if(cfg.swap !== 'none') throw cfg.swap;
			};
			if (cfg.transition)
				await cfg.transition(doSwap).finished;
			else
				await doSwap();
			send(elt, "swapped", {cfg});
			if (!document.contains(elt)) send(document, "swapped", {cfg});

			// === BOOSTI: fx-reset ===
			if (elt.hasAttribute("fx-reset") && cfg.response.ok && form) {
				form.reset();
			}
		};
		let triggerStr = attr(elt, "fx-trigger", elt.matches("form") ? "submit" : elt.matches("input:not([type=button]),select,textarea") ? "change" : "click");
		let triggers = parseTriggers(triggerStr);
		elt.__fixi.evt = triggers.map(s=>s.evt).join(", ");
		for (let spec of triggers) {
			let handler = wrapHandler(elt.__fixi, spec, elt);
			if (spec.evt === "intersect") {
				let fired = false;
				let obs = new IntersectionObserver((entries) => {
					if (entries[0].isIntersecting && !fired) {
						fired = true;
						handler(new CustomEvent("intersect"));
						if (spec.once) obs.disconnect();
					}
				}, {threshold: spec.threshold || 0});
				obs.observe(elt);
				// Check if already visible (IntersectionObserver may not fire synchronously)
				requestAnimationFrame(() => {
					if (!fired && elt.getBoundingClientRect().top < window.innerHeight) {
						fired = true;
						handler(new CustomEvent("intersect"));
						if (spec.once) obs.disconnect();
					}
				});
			} else {
				elt.addEventListener(spec.evt, handler, spec.once ? {...options, once: true} : options);
			}
		}
		send(elt, "inited", {}, false);
	};
	let process = (n)=>{
		if (n.matches){
			if (ignore(n)) return;
			if (n.matches("[fx-action]")) init(n);
		}
		if(n.querySelectorAll) n.querySelectorAll("[fx-action]").forEach(init);
	};
	document.addEventListener("fx:process", (evt)=>process(evt.target));

	// === BOOSTI: Boost (SPA-like navigation) with head merging ===
	function mergeHead(newHead) {
		const currentHead = document.head;
		const newHeadChildren = new Map();

		// Index new head elements by outerHTML
		for (const child of newHead.children) {
			newHeadChildren.set(child.outerHTML, child);
		}

		// Check current head elements
		const toRemove = [];
		for (const child of currentHead.children) {
			const key = child.outerHTML;
			if (newHeadChildren.has(key)) {
				// Element exists in both - keep it, remove from "to add" map
				newHeadChildren.delete(key);
			} else if (!child.hasAttribute('fx-preserve')) {
				// Element only in old head and not preserved - mark for removal
				toRemove.push(child);
			}
		}

		// Append new elements first (to avoid FOUC for stylesheets)
		for (const newChild of newHeadChildren.values()) {
			currentHead.appendChild(document.createRange().createContextualFragment(newChild.outerHTML));
		}

		// Then remove old elements
		for (const child of toRemove) {
			child.remove();
		}
	}

	async function boost(url, options) {
		try {
			const resp = await fetch(url, options);
			if (resp.redirected) {
				return boost(resp.url, { method: 'GET' });
			}
			const html = await resp.text();
			const doc = new DOMParser().parseFromString(html, 'text/html');
			const swap = () => {
				document.title = doc.title;
				mergeHead(doc.head);
				document.body.replaceWith(doc.body.cloneNode(true));
				window.scrollTo(0, 0);
				// Re-process new body for fx-action elements
				process(document.body);
			};
			document.startViewTransition ? await document.startViewTransition(swap).finished : swap();
			if (!options || options.method === 'GET') {
				history.pushState({}, '', url);
			}
		} catch (e) {
			location.href = url;
		}
	}

	function isBoosted(el) {
		return !el.closest('[fx-boost="false"]');
	}

	// Boost links
	document.addEventListener('click', (e) => {
		const link = e.target.closest('a[href^="/"]');
		if (!link || link.hasAttribute('fx-action') || !isBoosted(link) || e.ctrlKey || e.metaKey || e.shiftKey) return;
		e.preventDefault();
		boost(link.href, { method: 'GET' });
	});

	// Boost forms
	document.addEventListener('submit', (e) => {
		const form = e.target;
		if (form.hasAttribute('fx-action') || !isBoosted(form)) return;
		e.preventDefault();
		const method = (form.method || 'GET').toUpperCase();
		const url = form.action || location.href;
		if (method === 'GET') {
			const params = new URLSearchParams(new FormData(form));
			boost(url + (url.includes('?') ? '&' : '?') + params, { method: 'GET' });
		} else {
			boost(url, { method, body: new FormData(form) });
		}
	});

	// Handle back/forward
	window.addEventListener('popstate', () => boost(location.href, { method: 'GET' }));
	// Initialize on DOMContentLoaded
	document.addEventListener("DOMContentLoaded", ()=>{
		document.__fixi_mo.observe(document.documentElement, {childList:true, subtree:true});
		process(document.body);
	});
})();
