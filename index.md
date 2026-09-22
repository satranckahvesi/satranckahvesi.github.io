---
layout: default
---

<div id="yazilar" class="section">
  <h2>Yazılar</h2>
  <ul class="post-list">
    {% assign all_posts = site.posts | sort: "date" | reverse %}
    {% for post in all_posts %}
    {% assign author_slug = post.author | slugify: "latin" %}
    {% assign column_slug = post.column | slugify: "latin" %}
    <li>
      <span class="post-list-meta"><a href="{{ '/koseler/' | append: column_slug | append: '/' | relative_url }}">{{ post.column }}</a></span>
      <a href="{{ post.url | relative_url }}">{{ post.title }}</a>
      <span class="post-list-meta">
        <a href="{{ '/yazarlar/' | append: author_slug | append: '/' | relative_url }}">{{ post.author }}</a>
        · {% include turkish-date.html date=post.date %}
      </span>
    </li>
    {% endfor %}
  </ul>
</div>

{% include ornament.html %}

<div id="koseler" class="section">
  <h2>Köşeler</h2>
  <ul class="tag-list">
    {% assign columns = site.posts | map: "column" | uniq %}
    {% for col in columns %}
    {% assign col_slug = col | slugify: "latin" %}
    <li><a class="link-primary" href="{{ '/koseler/' | append: col_slug | append: '/' | relative_url }}">{{ col }}</a></li>
    {% endfor %}
  </ul>
</div>

{% include ornament.html %}

<div id="yazarlar" class="section">
  <h2>Yazarlar</h2>
  <ul class="tag-list">
    {% assign authors = site.posts | map: "author" | uniq %}
    {% for author in authors %}
    {% assign author_slug = author | slugify: "latin" %}
    <li><a class="link-primary" href="{{ '/yazarlar/' | append: author_slug | append: '/' | relative_url }}">{{ author }}</a></li>
    {% endfor %}
  </ul>
</div>
