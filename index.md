---
layout: default
---

<div id="yazilar" class="section">
  <ul class="post-list">
    {% assign all_posts = site.posts | sort: "date" | reverse %}
    {% for post in all_posts %}
    {% include post-list-item.html post=post meta="author" lead_column=true %}
    {% endfor %}
  </ul>
</div>

{% include ornament.html %}

<div id="koseler" class="section">
  <h2>Köşeler</h2>
  <ul class="tag-list pill-list">
    {% assign columns = site.posts | map: "column" | uniq %}
    {% for col in columns %}
    <li><a href="{% include column-url.html name=col %}">{{ col }}</a></li>
    {% endfor %}
  </ul>
</div>

{% include ornament.html %}

<div id="yazarlar" class="section">
  <h2>Yazarlar</h2>
  <ul class="tag-list avatar-list">
    {% assign authors = site.posts | map: "author" | uniq %}
    {% for author in authors %}
    {% assign words = author | split: " " %}
    {% if site.chess_titles contains words[0] %}
      {% assign name_words = words | slice: 1, 10 %}
    {% else %}
      {% assign name_words = words %}
    {% endif %}
    {% assign first_initial = name_words | first | slice: 0, 1 %}
    {% assign last_initial = name_words | last | slice: 0, 1 %}
    {% assign initials = first_initial | append: last_initial %}
    <li>
      <a href="{% include author-url.html name=author %}">
        <span class="avatar-circle" aria-hidden="true">{{ initials | upcase }}</span>
        <span class="avatar-name">{{ author }}</span>
      </a>
    </li>
    {% endfor %}
  </ul>
</div>
