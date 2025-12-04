<h1>🚀 boosti.js - fixi.js plus boosted links</h1>

![assets/boosti-serene.avif](assets/boosti-serene.avif)

[fixi.js](https://github.com/bigskysoftware/fixi) is Garson Gross' experimental, minimalist implementation of a subset of [htmx](https://htmx.org/). [boosti.js](https://github.com/JensRoland/boosti) is a fork of fixi.js that adds support for 'boosted' links and form submissions, as well as some other small yet important features which weren't included in the original fixi.js.

If you aren't familiar with HTMX, fixi.js, or boosted links, you are *likely lost*, and I can only recommend you read Carson Gross' excellent [htmx documentation](https://htmx.org/docs/), as well as the [blog post introducing fixi.js](https://htmx.org/essays/the-fetchening/).

I'll wait.

## API

The boosti api consists of eleven HTML attributes, nine events & two properties.

Here is an example:

```html
<button fx-action="/content" <!-- URL to issue request to -->
        fx-method="get"      <!-- HTTP Method to use -->
        fx-trigger="click"   <!-- Event that triggers the request -->
        fx-target="#output"  <!-- Element to swap -->
        fx-swap="innerHTML"> <!-- How to swap -->
    Get Content
</button>
<output id="output"></output>
```

When this boosti-powered `button` is clicked it will issue an HTTP `GET` request to the `/content` [relative URL](https://www.w3.org/TR/WD-html40-970917/htmlweb.html#h-5.1.2) and swap the HTML content of the response inside the `output` tag below it.

## Differences From fixi.js

The main and eponymous difference between boosti.js and fixi.js is that boosti.js supports 'boosted' links and form submissions. This means that any anchor (`<a>`) or form (`<form>`) element in the DOM will automatically be handled by boosti.js, unless the element or an ancestor is marked with the `fx-boost="false"` attribute. In other words, boosting is on by default.

Another difference is in the implementation of boosted links and forms: boosti.js uses a simple approach based on the View Transition API to provide a smooth transition between the current page and the new content. This is less sophisticated (and not fully supported in all browsers) than the approach used by htmx, but it is also much simpler and smaller, keeping in line with the minimalist philosophy of fixi.js.

Finally, boosti.js adds several extra attributes and features to the fixi.js API:

* `fx-boost` - used to disable boosting on specific elements or their ancestors
* `fx-confirm` - when present on an element, will cause a confirmation dialog to be shown before the request is issued
* `fx-reset` - when present on a form element, will cause the form to be reset after a successful request
* `fx-indicator` - CSS selector for an element to show during requests (adds/removes `fx-request` class)
* `fx-trigger` modifiers - support for `delay:Nms`, `throttle:Nms`, `changed`, `once`, and `threshold:N`
* `intersect` trigger - fires when element enters viewport using IntersectionObserver

## Minimalism

![assets/zen-stones.avif](assets/zen-stones.avif)

The current uncompressed size is `7736` bytes, the gzipped size is `2915` bytes and the brotli'd size is `2531` bytes, as determined by:

```bash
ls -l boosti.js | awk  '{print "raw:", $5}'; gzip -k boosti.js; ls -l boosti.js.gz | awk  '{print "gzipped:", $5}'; rm boosti.js.gz; brotli boosti.js; ls -l boosti.js.br | awk  '{print "brotlid:", $5}'; rm boosti.js.br
```

Is that a lot? Well, boosti is a replacement for all the core parts of htmx, which as of December 2025 is `51,250` bytes minified, `16,615` bytes gzipped, and `15,003` bytes brotli'd. So in comparison boosti is tiny.

As its predecessor, boosti has very few moving parts:

* No dependencies (including test and development)
* No JavaScript API (beyond the events)
* No minified `boosti.min.js` file
* No `package.json`
* No build step

The boosti project consists of four files:

* [`boosti.js`](boosti.js), the code for the library
* [`yolomode.js`](yolomode.js), boosti.js + speculative preloading (see below)
* [`test.html`](test.html), the test suite for the library
* This [`README.md`](README.md)

[`test.html`](test.html) is a stand-alone HTML file that implements its own visual testing infrastructure, mocking for `fetch()`, etc. and that can be opened using the `file:` protocol for easy testing.

## Examples

Here are some basic examples of boosti in action:

### Click To Edit

The htmx [click to edit example](https://htmx.org/examples/click-to-edit/) can be easily ported to boosti:

```html
<div id="target-div">
    <div><label>First Name</label>: Joe</div>
    <div><label>Last Name</label>: Blow</div>
    <div><label>Email</label>: joe@blow.com</div>
    <button fx-action="/contact/1/edit" fx-target="#target-div" class="btn primary">
    Click To Edit
    </button>
</div>
```

### Delete Row

The [delete row example](https://htmx.org/examples/delete-row/) from htmx can be implemented in boosti like so:

```html
<tr id="row-1">
  <td>Angie MacDowell</td>
  <td>angie@macdowell.org</td>
  <td>Active</td>
  <td>
    <button class="btn danger" fx-action="/contact/1" fx-method="delete" fx-target="#row-1" fx-swap="outerHTML" fx-confirm="Are you sure you want to delete this contact?">
      Delete
    </button>
  </td>
</tr>
```

### Lazy Loading

The htmx [lazy loading](https://htmx.org/examples/lazy-load/) example can be ported to boosti using the `intersect` trigger:

```html
<div fx-action="/lazy-content" fx-trigger="intersect once">
  Content Loading...
</div>
```

This fires when the element enters the viewport. The `once` modifier ensures it only loads once. You can also use `threshold:0.5` to require 50% visibility before triggering.

### Search Input with Debounce

boosti supports trigger modifiers similar to htmx. You can use `delay`, `changed`, `throttle`, and `once`:

```html
<input fx-action="/search"
       fx-trigger="input changed delay:300ms"
       fx-target="#results"
       name="q"
       placeholder="Search...">
<div id="results"></div>
```

This input will only trigger a request when:

1. The value has actually **changed** (not just any input event)
2. After a 300ms **delay** (debounce) - rapid typing resets the timer

### Multiple Triggers

You can specify multiple triggers separated by commas, each with their own modifiers:

```html
<button fx-action="/data"
        fx-trigger="click, keyup[Enter] delay:100ms, search">
  Load Data
</button>
```

### Available Trigger Modifiers

| Modifier       | Description                                       | Example          |
| -------------- | ------------------------------------------------- | ---------------- |
| `delay:Nms`    | Debounce - wait N milliseconds after last event   | `delay:300ms`    |
| `throttle:Nms` | Rate limit - fire at most once per N milliseconds | `throttle:500ms` |
| `changed`      | Only fire if the element's value has changed      | `input changed`  |
| `once`         | Fire only once, then remove the listener          | `click once`     |
| `threshold:N`  | For `intersect` - visibility ratio (0-1) required | `threshold:0.5`  |

### Special Triggers

| Trigger     | Description                        |
| ----------- | ---------------------------------- |
| `intersect` | Fires when element enters viewport |

### Loading Indicator

Use `fx-indicator` to show a loading state during requests:

```html
<button fx-action="/data" fx-indicator="#spinner">
  Load Data
</button>
<span id="spinner" class="hidden">Loading...</span>

<style>
  .hidden { display: none; }
  .hidden.fx-request { display: inline; }
</style>
```

The `fx-request` class is added to the indicator element when a request starts and removed when it completes (or errors).

## YOLO Mode: Speculative Preloading

![assets/boosti-yolomode.avif](assets/boosti-yolomode.avif)

> *"This library fucks!"* – Russ Hanneman

If you like reckless speeds and don't care about wimpy minimalism, `yolomode.js` is for you. YOLO Mode includes everything in boosti.js plus speculative preloading inspired by [instant.page](https://instant.page/) and toxic masculinity. What that means is it **prefetches URLs when users merely hover over links**, gaining precious milliseconds so that subsequent clicks feel instant.

### Usage

Just replace `boosti.js` with `yolomode.js` and `fx-yolo` everything you want to go faster than a cheeetah on rocket skates.

![assets/cheetah-on-rocket-skates.avif](assets/cheetah-on-rocket-skates.avif)

**Can you put it on a link?** Hell yes you can:

```html
<a href="/more-magic" fx-yolo>
  This hyperlink is now an ultralink. Don't question it.
</a>
```

**Can you put it on a button?** You bet your ass my friend:

```html
<button fx-action="/boom-baby" fx-yolo>
  When you hit this button it'll already be too late
</button>
```

**Can you put it on my tab?** Why the fuck not:

```html
<ion-tab yolo></ion-tab>
```

It probably won't do anything, *but you can do it* and that's what's so beautiful about it. It can do *anything*. YOLO you brainy fucks.

### Attributes

| Attribute        | Description                                                      |
| ---------------- | ---------------------------------------------------------------- |
| `fx-yolo`        | Prefetch the URL on hover/touchstart                             |
| `fx-yolo-deep`   | That, plus preloads all assets in the fetched HTML like a *baws* |

### How It Works

Okay now check this out:

* **Hover**: Waits 65ms before prefetching so the load doesn't blow prematurely from simply users waving their thing around the screen. You wanna be fast, but not *too* fast, you know what I mean. Yeeeah you do. This guy *fucks*.
* **Touch screens**: Prefetches immediately on touchstart, like a loser. But that's a good thing though. Phones are slow as fuck, we just gotta get in there as fast as possible. No judgment.
* **GET only**: Only prefetch GET requests. Don't try and pre-POST something like an asshole. Don't be that guy.
* **Once**: Each element is only prefetched once. That's the second O in YOLO. It's there for a reason. **This** is that reason.

### Browser Standardization Is A Lie

To do this, we need to solve preloading in three distinct scenarios:

1. Prefetching the target HTML as `fetch` for boosted links
2. Prefetching the target HTML as `document` for `fx-action`
3. Prerendering the assets needed by the target page for **maximum YOLO**!

Wouldn't it be nice if there was one way to do all of that, and that way actually worked for once? Yeah, good luck with that. This is where things get messy, so strap in. Or peace out and go kitesurfing with supermodels on Branson's island. I'm not here to tell you what to do. Okay, so here's what you do:

**Prefetching strategies (fetch):**

* ❌ Prefetch via the Speculation Rules API? Supported in Chrome and Edge only, and in practice doesn't even seem to work in Chrome. No idea why, not worth wasting any more time on it.
* ✅ Prefetch via fetch()? Solid, simple, reliable. Why are we trying these other things again?
* ❌ `<link rel="prefetch">`? Doesn't work for boosted links, and it's not supported in Safari.
* ❌ `<link rel="preload" as="fetch">`? Ironically prefetches as `document`, not `fetch`, so doesn't work for boosted links.

**Prefetching strategies (document, for fx-action):**

* ❌ Prefetch via the Speculation Rules API? Again, should work, but doesn't.
* ❌ Prefetch via fetch()? Boosted links only -- *next!*
* ⚠️ `<link rel="prefetch">`? Not supported in Safari. Fucking Steve Jobs.
* ⚠️ `<link rel="preload" as="fetch">`? Prefetches HTML as document in Chrome, but not sure if all browsers agree; wouldn't bet on it.

**Prerendering assets strategies:**

* ⚠️ Prerender via the Speculation Rules API? Great, simple, does everything (even caches the HTML for *both* `document` *and* `fetch`)... but it's only supported in Chrome and Edge.
* ❌ `<link rel="prerender">`? Not supported in Safari or Firefox, and even Chrome seems to have given up on it.
* ✅ Stick the URL inside a sandboxed `<iframe>` offscreen? Oldschool and total overkill, but it works, so hey: ***YOLO baby!***
* ❌ Fetching the HTML and sticking it inside a document.createElement('div')? Unpredictable, unreliable, may execute scripts, won't load relative URLs, the choice of a madman.
* ❌ Fetching the HTML and sticking it inside a fragment or template instead? Who knows, I'm not gonna try it. You wanna waste your time? Huh? Be my guest.
* ✅ Fetching and parsing the HTML, finding all the assets and inserting them as `<link rel="preload">` tags? Sure, but what assets? Images only? Eager *and* lazy ones? Are you going to check for `fetchpriority="high"`? What about external CSS and JS? Fonts? Responsive image `srcset`s? Transitive preload tags? Where does it end? How many milliseconds are you gonna spend plowing that DOM this way and that? By the time you're ready to preload stuff, the user has clicked the link already.

**Legend:**

* ✅ Works well and widely supported. The perfect combination, like radio and the internet.
* ⚠️ A tease: Works -- but not really.
* ❌ Doesn't work, stop wasting my time.

So where does that leave YOLO Mode? Here's the deal:

* For `fx-yolo-deep`  :
  * If the Speculation Rules API is supported, we use that to prerender the page.
  * Otherwise we create a sandboxed offscreen iframe to prerender the assets; and if it's a boosted link, we slip in an extra `fetch()` to prefetch the HTML as `fetch` since the iframe caches as `document` like an asshole.

* For `fx-yolo`:
  * For boosted links, we use `fetch()`.
  * For `fx-action`, we use `<link rel="prefetch">` which works everywhere but Safari, and then we go short some Apple stock because fuck 'em.

### Smart Resouirce Utilization

YOLO Mode automatically disables itself when it detects a small screen (<450k pixels) AND a slow connection (2g) or data saver enabled.

This ensures mobile users on slow connections aren't penalized. *Heh, peeenalized*.

### Size

Who cares, YOLO Mode does what it wants and doesn't ask for permission. That's the whole point, dude. Doesn't matter if it's a megabyte, doesn't matter if it's five. Look, it's like my Super Sport 300; anyone'll tell you it's too much fucking money and it takes forever to deliver it to you, frankly it's ridiculous, you know it's ridiculous. But that doesn't matter. You'll pay it and you'll wait, and you'll like it because once it gets there it's fast as shit.

## On The Rhetorical and Artistic Merit of Parody, Sarcasm, and Deliberate Ineloquence

*Fuck you.*

## LICENSE

```text
Zero-Clause BSD
=============

Permission to use, copy, modify, and/or distribute this software for
any purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED “AS IS” AND THE AUTHOR DISCLAIMS ALL
WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES
OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLEs
FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY
DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN
AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT
OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
```

<h2>&#x1f480; <i>Memento Mori</i></h2>

```js
/**
* Adding a single line to this file requires great internal reflection
* and thought.  You must ask yourself if your one line addition is so
* important, so critical to the success of the company, that it warrants
* a slowdown for every user on every page load.  Adding a single letter
* here could cost thousands of man hours around the world.
* 
* That is all.
*/
```

-- [A comment](https://www.youtube.com/watch?v=wHlyLEPtL9o&t=1528s) at the beginning of [Primer](https://gist.github.com/makinde/376039)
