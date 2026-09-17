---
layout: default
---

<div class="section intro">
<h3>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</h3>
<p>Fusce varius tempor elit vitae interdum. Cras eros enim, dapibus vel congue sed, congue vel quam. Donec at consequat urna, ac dictum erat.</p>
</div>
{% include ornament.html %}

<div class="section">
  <h2>Köşeler</h2>
  {% assign columns = site.posts | map: "column" | uniq %}
  <ul>
    {% for col in columns %}
    {% assign col_slug = col | slugify: "latin" %}
    {% assign latest = site.posts | where: "column", col | first %}
    {% assign author_slug = latest.author | slugify: "latin" %}
    <li>
      <a href="{{ '/koseler/' | append: col_slug | append: '/' | relative_url }}">{{ col }}</a>
      <span class="section-latest"><a href="{{ latest.url | relative_url }}">{{ latest.title }}</a></span>
      <span class="section-author"><a href="{{ '/yazarlar/' | append: author_slug | append: '/' | relative_url }}">{{ latest.author }}</a></span>
    </li>
    {% endfor %}
  </ul>
</div>
{% include ornament.html %}
