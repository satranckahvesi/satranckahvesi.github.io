---
layout: default
---

<div class="section intro">
  <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce varius tempor elit vitae interdum. Cras eros enim, dapibus vel congue sed, congue vel quam. Donec at consequat urna, ac dictum erat. Donec ultrices eros non nisi volutpat accumsan. Curabitur eget dui ex. Fusce ornare iaculis vestibulum. Quisque ultricies neque ultricies cursus iaculis. Pellentesque aliquam massa ac dui blandit, vel tempor felis hendrerit.</p>
</div>
{% include ornament.html %}

{% assign columns = site.posts | map: "column" | uniq %}

<div class="section">
  <h2>Köşeler</h2>
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
