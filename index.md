---
layout: default
---

{% assign columns = site.posts | map: "column" | uniq %}
{% assign authors = site.posts | map: "author" | uniq %}

<div class="section">
  <h2>Köşeler</h2>
  <ul>
    {% for col in columns %}
    {% assign latest = site.posts | where: "column", col | first %}
    <li><a href="{{ latest.url | relative_url }}">{{ col }}</a></li>
    {% endfor %}
  </ul>
</div>

<div class="section">
  <h2>Yazarlar</h2>
  <ul>
    {% for name in authors %}
    {% assign latest = site.posts | where: "author", name | first %}
    <li><a href="{{ latest.url | relative_url }}">{{ name }}</a></li>
    {% endfor %}
  </ul>
</div>
