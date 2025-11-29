<h1>&#x1F6B2; boosti.js - fixi.js plus boosted links</h1>

[fixi.js](https://github.com/bigskysoftware/fixi) is Garson Gross' experimental, minimalist implementation
of a subset of [htmx](https://htmx.org/). This is a fork of fixi.js that adds support for 'boosted' links and form submissions, as well as some other small yet important features which weren't included in the original fixi.js.

If you aren't familiar with HTMX, fixi.js or boosted links, you are *likely lost*, and I can only recommend you read Carson Gross' excellent [htmx documentation](https://htmx.org/docs/), as well as the [blog post introducing fixi.js](https://htmx.org/essays/the-fetchening/).

I'll wait.

## API

The boosti api consists of nine HTML attributes, nine events & two properties.

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

Finally, boosti.js adds three extra attributes to the fixi.js API to support common use cases. These are:

* `fx-boost` - used to disable boosting on specific elements or their ancestors
* `fx-confirm` - when present on an element, will cause a confirmation dialog to be shown before the request is issued
* `fx-reset` - when present on a form element, will cause the form to be reset after a successful request

## Minimalism

The current uncompressed size is `5453` bytes, the gzipped size is `2132` bytes and the brotli'd size is `1820` bytes,
as determined by:

```bash
ls -l boosti.js | awk  '{print "raw:", $5}'; gzip -k boosti.js; ls -l boosti.js.gz | awk  '{print "gzipped:", $5}'; rm boosti.js.gz; brotli boosti.js; ls -l boosti.js.br | awk  '{print "brotlid:", $5}'; rm boosti.js.br
```

Like a fixed-gear bike, boosti has very few moving parts:

* No dependencies (including test and development)
* No JavaScript API (beyond the events)
* No minified `boosti.min.js` file
* No `package.json`
* No build step

The boosti project consists of three files:

* [`boosti.js`](boosti.js), the code for the library
* [`test.html`](test.html), the test suite for the library
* This [`README.md`](README.md)

[`test.html`](test.html) is a stand-alone HTML file that implements its own visual testing infrastructure, mocking for `fetch()`, etc. and that can be opened using the `file:` protocol for easy testing.

## Examples

Here are some basic examples of boosti in action

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

The htmx [lazy loading](https://htmx.org/examples/lazy-load/) example can be ported to boosti using the `fx:inited` event:

```html
<div fx-action="/lazy-content" fx-trigger="fx:inited">
  Content Loading...
</div>
```

## LICENCE

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
