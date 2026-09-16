---
layout: default
---

<div class="section">
  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce varius tempor elit vitae interdum. Cras eros enim, dapibus vel congue sed, congue vel quam. Donec at consequat urna, ac dictum erat. Donec ultrices eros non nisi volutpat accumsan. Curabitur eget dui ex. Fusce ornare iaculis vestibulum. Quisque ultricies neque ultricies cursus iaculis. Pellentesque aliquam massa ac dui blandit, vel tempor felis hendrerit.
</div>

{% assign columns = site.posts | map: "column" | uniq %}
{% assign authors = site.posts | map: "author" | uniq %}

<div class="section">
  <h2>Köşeler</h2>
  <ul>
    {% for col in columns %}
    {% assign col_slug = col | slugify: "latin" %}
    {% assign latest = site.posts | where: "column", col | first %}
    <li>
      <a href="{{ '/koseler/' | append: col_slug | append: '/' | relative_url }}">{{ col }}</a>
      <span class="section-latest"><a href="{{ latest.url | relative_url }}">{{ latest.title }}</a></span>
    </li>
    {% endfor %}
  </ul>
</div>

<div class="section">
  <h2>Yazarlar</h2>
  <ul>
    {% for name in authors %}
    {% assign author_slug = name | slugify: "latin" %}
    {% assign latest = site.posts | where: "author", name | first %}
    <li>
      <a href="{{ '/yazarlar/' | append: author_slug | append: '/' | relative_url }}">{{ name }}</a>
      <span class="section-latest"><a href="{{ latest.url | relative_url }}">{{ latest.title }}</a></span>
    </li>
    {% endfor %}
  </ul>
</div>
