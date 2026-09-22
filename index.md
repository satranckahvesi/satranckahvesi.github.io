---
layout: default
---

<div id="yazilar" class="section">
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
  <ul class="tag-list pill-list">
    {% assign columns = site.posts | map: "column" | uniq %}
    {% for col in columns %}
    {% assign col_slug = col | slugify: "latin" %}
    <li><a href="{{ '/koseler/' | append: col_slug | append: '/' | relative_url }}">{{ col }}</a></li>
    {% endfor %}
  </ul>
</div>

{% include ornament.html %}

<div id="yazarlar" class="section">
  <h2>Yazarlar</h2>
  <ul class="tag-list avatar-list">
    {% assign authors = site.posts | map: "author" | uniq %}
    {% assign titles = "FM,GM,IM,CM,WFM,WGM,WIM,WCM,NM,AGM,AIM" | split: "," %}
    {% for author in authors %}
    {% assign author_slug = author | slugify: "latin" %}
    {% assign words = author | split: " " %}
    {% if titles contains words[0] %}
      {% assign name_words = words | slice: 1, 10 %}
    {% else %}
      {% assign name_words = words %}
    {% endif %}
    {% assign first_initial = name_words | first | slice: 0, 1 %}
    {% assign last_initial = name_words | last | slice: 0, 1 %}
    {% assign initials = first_initial | append: last_initial %}
    <li>
      <a href="{{ '/yazarlar/' | append: author_slug | append: '/' | relative_url }}">
        <span class="avatar-circle" aria-hidden="true">{{ initials | upcase }}</span>
        <span class="avatar-name">{{ author }}</span>
      </a>
    </li>
    {% endfor %}
  </ul>
</div>
