/*
 * dc-lite — a tiny runtime for the .dc.html template format used by this app.
 * It supports the subset the app needs: {{ dotted.path }} holes, <sc-if>, <sc-for>,
 * onClick / onMouseEnter / onFocus / onChange handlers, and a class that extends DCLogic
 * with renderVals() / setState() / componentDidMount().
 * Nothing here talks to the network; state lives in the page.
 */
(function () {
  'use strict';
  var SVG_NS = 'http://www.w3.org/2000/svg';
  var VOID = { br: 1, hr: 1, img: 1, input: 1, link: 1, meta: 1, source: 1, wbr: 1 };

  /* ---------- parser: template text -> tree (no HTML-parser quirks around tables / selects) ---------- */
  function parse(src) {
    var root = { t: 'el', tag: '#root', attrs: [], children: [] };
    var stack = [root], i = 0, n = src.length;
    function top() { return stack[stack.length - 1]; }
    while (i < n) {
      if (src.startsWith('<!--', i)) { var e = src.indexOf('-->', i); i = e < 0 ? n : e + 3; continue; }
      if (src.startsWith('</', i)) {
        var ce = src.indexOf('>', i); i = ce < 0 ? n : ce + 1;
        if (stack.length > 1) stack.pop();
        continue;
      }
      if (src[i] === '<' && /[A-Za-z]/.test(src[i + 1] || '')) {
        var j = i + 1, nm = '';
        while (j < n && /[\w:-]/.test(src[j])) nm += src[j++];
        var attrs = [], selfClose = false;
        for (;;) {
          while (j < n && /\s/.test(src[j])) j++;
          if (src[j] === '/' && src[j + 1] === '>') { selfClose = true; j += 2; break; }
          if (src[j] === '>') { j++; break; }
          if (j >= n) break;
          var an = '';
          while (j < n && !/[\s=\/>]/.test(src[j])) an += src[j++];
          while (j < n && /\s/.test(src[j])) j++;
          var av = '';
          if (src[j] === '=') {
            j++;
            while (j < n && /\s/.test(src[j])) j++;
            var q = src[j];
            if (q === '"' || q === "'") { var k = src.indexOf(q, j + 1); av = src.slice(j + 1, k); j = k + 1; }
            else { while (j < n && !/[\s>]/.test(src[j])) av += src[j++]; }
          }
          if (an) attrs.push([an, av]);
        }
        var parent = top();
        var ns = (nm === 'svg' || parent.ns === SVG_NS) ? SVG_NS : null;
        var node = { t: 'el', tag: nm, attrs: attrs, children: [], ns: ns };
        parent.children.push(node);
        if (!selfClose && !VOID[nm]) stack.push(node);
        i = j;
        continue;
      }
      var te = src.indexOf('<', i + 1);
      if (te < 0) te = n;
      top().children.push({ t: 'text', v: src.slice(i, te) });
      i = te;
    }
    return root;
  }

  function dec(s) {
    return s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
  }

  /* ---------- evaluation ---------- */
  function lookup(scope, path) {
    path = path.trim();
    if (path === 'true') return true;
    if (path === 'false') return false;
    if (path === 'null') return null;
    if (/^-?\d+(\.\d+)?$/.test(path)) return parseFloat(path);
    var parts = path.split('.'), v = scope;
    for (var i = 0; i < parts.length; i++) {
      if (v === null || v === undefined) return undefined;
      v = v[parts[i]];
    }
    return v;
  }
  var HOLE = /\{\{\s*([^}]+?)\s*\}\}/g;
  var PURE = /^\{\{\s*([^}]+?)\s*\}\}$/;
  function interp(str, scope) {
    return str.replace(HOLE, function (_, p) { var v = lookup(scope, p); return v === null || v === undefined ? '' : String(v); });
  }
  function attrOf(node, name) {
    for (var i = 0; i < node.attrs.length; i++) if (node.attrs[i][0] === name) return node.attrs[i][1];
    return undefined;
  }
  function rawAttr(node, name, scope) {
    var a = attrOf(node, name);
    if (a === undefined) return undefined;
    var m = PURE.exec(a.trim());
    return m ? lookup(scope, m[1]) : interp(dec(a), scope);
  }

  var EVENTS = { onClick: 'click', onMouseEnter: 'mouseenter', onFocus: 'focus', onChange: 'input', onInput: 'input' };
  function ensure(el, type) {
    if (!el.__l) el.__l = {};
    if (el.__l[type]) return;
    el.__l[type] = 1;
    el.addEventListener(type, function (e) { var f = el.__ev && el.__ev[type]; if (f) f(e); });
  }

  /* ---------- build: template + scope -> detached DOM ---------- */
  function build(nodes, scope, parent) {
    for (var i = 0; i < nodes.length; i++) {
      var nd = nodes[i];
      if (nd.t === 'text') {
        if (/^\s*$/.test(nd.v) && /\n/.test(nd.v)) continue;
        parent.appendChild(document.createTextNode(interp(dec(nd.v), scope)));
        continue;
      }
      if (nd.tag === 'sc-if') {
        if (rawAttr(nd, 'value', scope)) build(nd.children, scope, parent);
        continue;
      }
      if (nd.tag === 'sc-for') {
        var list = rawAttr(nd, 'list', scope) || [], as = attrOf(nd, 'as') || 'item';
        for (var k = 0; k < list.length; k++) {
          var sc = Object.create(scope);
          sc[as] = list[k]; sc.$index = k;
          build(nd.children, sc, parent);
        }
        continue;
      }
      var el = nd.ns ? document.createElementNS(nd.ns, nd.tag) : document.createElement(nd.tag);
      for (var a = 0; a < nd.attrs.length; a++) {
        var name = nd.attrs[a][0], rawv = nd.attrs[a][1];
        if (name.indexOf('hint-') === 0) continue;
        if (EVENTS[name]) {
          var m = PURE.exec(rawv.trim());
          var fn = m ? lookup(scope, m[1]) : null;
          if (typeof fn === 'function') {
            var type = EVENTS[name];
            if (!el.__ev) el.__ev = {};
            el.__ev[type] = fn;
            ensure(el, type);
          }
          continue;
        }
        var val = rawAttr(nd, name, scope);
        if (name === 'value' && (nd.tag === 'input' || nd.tag === 'select' || nd.tag === 'textarea')) {
          el.__val = val === null || val === undefined ? '' : String(val);
          continue;
        }
        if (typeof val === 'boolean') {
          if (name.indexOf('aria-') === 0) el.setAttribute(name, String(val));
          else if (val) el.setAttribute(name, '');
          continue;
        }
        if (val === null || val === undefined) continue;
        el.setAttribute(name, String(val));
      }
      build(nd.children, scope, el);
      if (el.__val !== undefined && el.value !== el.__val) el.value = el.__val;
      parent.appendChild(el);
    }
  }

  /* ---------- morph: patch the live DOM to match a freshly built tree ---------- */
  function morph(o, n) {
    var i, a;
    var oa = Array.prototype.slice.call(o.attributes);
    for (i = 0; i < oa.length; i++) if (!n.hasAttribute(oa[i].name)) o.removeAttribute(oa[i].name);
    var na = n.attributes;
    for (i = 0; i < na.length; i++) if (o.getAttribute(na[i].name) !== na[i].value) o.setAttribute(na[i].name, na[i].value);
    o.__ev = n.__ev;
    if (n.__ev) for (var t in n.__ev) ensure(o, t);
    var nc = Array.prototype.slice.call(n.childNodes);
    for (i = 0; i < nc.length; i++) {
      var x = o.childNodes[i], y = nc[i];
      if (!x) { o.appendChild(y); continue; }
      if (x.nodeType !== y.nodeType || (x.nodeType === 1 && x.nodeName !== y.nodeName)) { o.replaceChild(y, x); continue; }
      if (x.nodeType === 3) { if (x.nodeValue !== y.nodeValue) x.nodeValue = y.nodeValue; }
      else morph(x, y);
    }
    while (o.childNodes.length > nc.length) o.removeChild(o.lastChild);
    if (n.__val !== undefined) { o.__val = n.__val; if (o.value !== n.__val) o.value = n.__val; }
  }

  /* ---------- component base class ---------- */
  function DCLogic(props) { this.props = props || {}; this.state = {}; this._q = false; }
  DCLogic.prototype.setState = function (p) {
    var o = typeof p === 'function' ? p(this.state) : p;
    Object.assign(this.state, o);
    this._sched();
  };
  DCLogic.prototype.forceUpdate = function () { this._sched(); };
  DCLogic.prototype._sched = function () {
    var self = this;
    if (self._q) return;
    self._q = true;
    Promise.resolve().then(function () { self._q = false; if (self._render) self._render(); });
  };
  window.DCLogic = DCLogic;

  function boot() {
    var tplEl = document.getElementById('dc-template');
    var logicEl = document.querySelector('script[data-dc-script]');
    var rootEl = document.getElementById('dc-root');
    var tpl = tplEl.textContent;

    // <helmet> holds fonts and styles: move them into <head>
    tpl = tpl.replace(/<helmet>([\s\S]*?)<\/helmet>/, function (_, inner) {
      document.head.insertAdjacentHTML('beforeend', inner);
      return '';
    });

    var tree = parse(tpl);
    var Component = new Function('DCLogic', logicEl.textContent + '\nreturn Component;')(DCLogic);
    var inst = new Component({});
    var mounted = false;

    inst._render = function () {
      var vals = inst.renderVals();
      var scratch = document.createElement('div');
      build(tree.children, vals, scratch);
      if (!rootEl.firstChild) {
        while (scratch.firstChild) rootEl.appendChild(scratch.firstChild);
      } else {
        morph(rootEl, scratch);
      }
    };
    inst._render();
    if (!mounted && inst.componentDidMount) { mounted = true; inst.componentDidMount(); }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
