---
layout: default
title: "Köşeler"
permalink: /koseler/
---

<div class="section">
  <h2>Köşeler</h2>
  <ul class="index-list">
    {% assign columns = site.posts | map: "column" | uniq %}
    {% for col in columns %}
    {% assign col_slug = col | slugify: "latin" %}
    {% assign latest = site.posts | where: "column", col | sort: "date" | last %}
    {% assign author_slug = latest.author | slugify: "latin" %}
    <li>
      <h3><a class="link-primary" href="{{ '/koseler/' | append: col_slug | append: '/' | relative_url }}">{{ col }}</a></h3>
      <a class="index-latest no-underline-hover" href="{{ latest.url | relative_url }}">{{ latest.title }}</a>
      <span class="index-meta"><a class="no-underline-hover" href="{{ '/yazarlar/' | append: author_slug | append: '/' | relative_url }}">{{ latest.author }}</a> · {% include turkish-date.html date=latest.date %}</span>
    </li>
    {% endfor %}
  </ul>
</div>
