---
layout: default
---

{% include ornament.html %}

<div class="section">
  <h2>Köşeler</h2>
  {% assign columns = site.posts | map: "column" | uniq %}
  <ul>
    {% for col in columns %}
    {% assign col_slug = col | slugify: "latin" %}
    {% assign latest = site.posts | where: "column", col | sort: "date" | last %}
    {% assign author_slug = latest.author | slugify: "latin" %}
    <li>
      <a href="{{ '/koseler/' | append: col_slug | append: '/' | relative_url }}">{{ col }}</a>
      <span class="section-latest"><a href="{{ latest.url | relative_url }}">{{ latest.title }}</a></span>
      <span class="section-date">{% include turkish-date.html date=latest.date %}</span>
      <span class="section-author"><a href="{{ '/yazarlar/' | append: author_slug | append: '/' | relative_url }}">{{ latest.author }}</a></span>
    </li>
    {% endfor %}
  </ul>
</div>
{% include ornament.html %}

<div class="section">
  <h2>Yazarlar</h2>
  <div class="avatar-list">
    {% assign authors = site.posts | map: "author" | uniq %}
    {% for author in authors %}
    {% assign author_slug = author | slugify: "latin" %}
    {% assign words = author | split: " " %}
    {% assign wlen = words | size %}
    {% if wlen > 1 %}
      {% assign i1_idx = wlen | minus: 2 %}
      {% assign i2_idx = wlen | minus: 1 %}
      {% assign i1 = words[i1_idx] | slice: 0, 1 %}
      {% assign i2 = words[i2_idx] | slice: 0, 1 %}
      {% assign initials = i1 | append: i2 %}
    {% else %}
      {% assign initials = words[0] | slice: 0, 1 %}
    {% endif %}
    <a class="avatar-link" href="{{ '/yazarlar/' | append: author_slug | append: '/' | relative_url }}">
      <span class="avatar">{{ initials }}</span>
      <span class="avatar-name">{{ author }}</span>
    </a>
    {% endfor %}
  </div>
</div>
{% include ornament.html %}
