class SiteBreadcrumb extends HTMLElement {
  connectedCallback() {
    const base = this.getAttribute('base') || './';
    const courseName = this.getAttribute('course-name') || '';
    const courseLink = this.getAttribute('course-link') || '';
    const topicName = this.getAttribute('topic-name') || '';

    const breadcrumb = document.createElement('div');
    breadcrumb.className = 'breadcrumb';
    breadcrumb.innerHTML = `
      <a href="${base}index.html">Home</a>
      <span>›</span>
      ${courseLink ? '<a href="' + courseLink + '">' + courseName + '</a>' : '<span>' + courseName + '</span>'}
      ${topicName ? '<span>›</span><span>' + topicName + '</span>' : ''}
    `;
    this.replaceWith(breadcrumb);
  }
}

customElements.define('site-breadcrumb', SiteBreadcrumb);