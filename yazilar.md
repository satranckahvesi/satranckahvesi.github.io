---
layout: default
title: "Yazılar"
permalink: /yazilar/
---

<div id="yazilar" class="section">
  <h2>Yazılar</h2>
  <ul class="post-list">
    {% assign all_posts = site.posts | sort: "date" | reverse %}
    {% for post in all_posts %}
    {% assign author_slug = post.author | slugify: "latin" %}
    {% assign column_slug = post.column | slugify: "latin" %}
    <li>
      <a href="{{ post.url | relative_url }}">{{ post.title }}</a>
      <span class="post-list-meta">
        <a href="{{ '/yazarlar/' | append: author_slug | append: '/' | relative_url }}">{{ post.author }}</a>
        ·
        <a href="{{ '/koseler/' | append: column_slug | append: '/' | relative_url }}">{{ post.column }}</a>
        · {% include turkish-date.html date=post.date %}
      </span>
    </li>
    {% endfor %}
  </ul>
</div>
