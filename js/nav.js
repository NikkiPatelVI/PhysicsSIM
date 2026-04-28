class SiteNav extends HTMLElement {
  connectedCallback() {
    const base = this.getAttribute('base') || './';
    const active = this.getAttribute('active') || '';

    const nav = document.createElement('nav');
    nav.innerHTML = `
      <a class="logo" href="${base}index.html">Nikki<span>Physics</span></a>
      <ul class="nav-links">
        <li><a href="${base}index.html"${active === 'home' ? ' class="active"' : ''}>Home</a></li>
        <li><a href="${base}courses/ap-physics-1/index.html"${active === 'ap-physics-1' ? ' class="active"' : ''}>AP Physics 1</a></li>
      </ul>
    `;
    this.replaceWith(nav);
  }
}

customElements.define('site-nav', SiteNav);
