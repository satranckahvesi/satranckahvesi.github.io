---
layout: default
title: "Yazarlar"
permalink: /yazarlar/
---

<div class="section">
  <h2>Yazarlar</h2>
  <ul class="index-list">
    {% assign authors = site.posts | map: "author" | uniq %}
    {% for author in authors %}
    {% assign author_slug = author | slugify: "latin" %}
    {% assign latest = site.posts | where: "author", author | sort: "date" | last %}
    {% assign column_slug = latest.column | slugify: "latin" %}
    <li>
      <h3><a class="link-primary" href="{{ '/yazarlar/' | append: author_slug | append: '/' | relative_url }}">{{ author }}</a></h3>
      <a class="index-latest no-underline-hover" href="{{ latest.url | relative_url }}">{{ latest.title }}</a>
      <span class="index-meta"><a class="no-underline-hover" href="{{ '/koseler/' | append: column_slug | append: '/' | relative_url }}">{{ latest.column }}</a> · {% include turkish-date.html date=latest.date %}</span>
    </li>
    {% endfor %}
  </ul>
</div>
