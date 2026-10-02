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
    {% assign latest = site.posts | where: "author", author | sort: "date" | last %}
    <li>
      <h3><a class="link-primary" href="{% include author-url.html name=author %}">{{ author }}</a></h3>
      <a class="index-latest no-underline-hover" href="{{ latest.url | relative_url }}">{{ latest.title }}</a>
      <span class="index-meta"><a class="no-underline-hover" href="{% include column-url.html name=latest.column %}">{{ latest.column }}</a> · {% include turkish-date.html date=latest.date %}</span>
    </li>
    {% endfor %}
  </ul>
</div>
