#!/usr/bin/env ruby
# frozen_string_literal: true

# Content consistency checks, run in CI on every push/PR (and locally with
# `bundle exec ruby scripts/check_content_links.rb`).
#
# Jekyll never validates any of the following, and every failure mode is
# silent (a dead link, a 404, a post that never publishes):
#
#   * each _posts/ filename is `<front-matter date>-<slug of the title>.md`
#     (the permalink is /posts/:title/, so the filename slug is the URL);
#   * front matter has the required keys, parses as YAML, and contains no
#     tab characters;
#   * every post's `author` / `column` exactly matches the `archive_value`
#     of a hand-written stub under yazarlar/ or koseler/, the stub is of
#     the right `archive_type`, and its `permalink` is the very URL the
#     templates build with `slugify: "latin"` (see _layouts/post.html);
#   * `redirect_from` paths do not shadow a real page.
#
# Slugs are computed with Jekyll's own slugify, so this script and the
# templates cannot drift apart. Apostrophes are dropped from a title before
# slugifying, so Turkish suffixes stay attached to their word
# ("Zürih 1953 Adaylar Turnuvası'ndan" -> "...turnuvasindan").

require 'date'
require 'jekyll'
require 'set'
require 'yaml'

ROOT = File.expand_path('..', __dir__)
REQUIRED_KEYS = %w[layout title date author column].freeze
FRONT_MATTER = /\A---[ \t]*\r?\n(.*?\r?\n?)^---[ \t]*$/m.freeze
FILENAME = /\A(\d{4}-\d{2}-\d{2})-(.+)\.md\z/.freeze

Page = Struct.new(:file, :front_matter, :raw_front_matter)

def slugify(text)
  Jekyll::Utils.slugify(text.to_s, mode: 'latin')
end

def title_slug(title)
  slugify(title.to_s.delete("'’"))
end

def load_page(path)
  text = File.read(path, encoding: 'UTF-8')
  match = FRONT_MATTER.match(text)
  return Page.new(path, nil, nil) unless match

  data = YAML.safe_load(match[1], permitted_classes: [Date, Time])
  Page.new(path, data.is_a?(Hash) ? data : nil, match[1])
rescue Psych::SyntaxError => e
  Page.new(path, nil, "YAML error: #{e.message}")
end

def pages(dir)
  Dir.glob(File.join(ROOT, dir, '*.md')).sort.map { |path| load_page(path) }
end

def date_string(value)
  value.respond_to?(:strftime) ? value.strftime('%Y-%m-%d') : value.to_s
end

def check_post(post, authors, columns, errors)
  name = "_posts/#{File.basename(post.file)}"
  data = post.front_matter
  if data.nil?
    errors << "#{name}: missing or unparsable front matter (#{post.raw_front_matter})"
    return
  end

  errors << "#{name}: tab character in front matter (use spaces)" if post.raw_front_matter.include?("\t")

  missing = REQUIRED_KEYS.reject { |key| data[key].to_s.strip != '' }
  errors << "#{name}: missing front matter #{missing.join(', ')}" unless missing.empty?
  return unless missing.empty?

  if (m = FILENAME.match(File.basename(post.file)))
    file_date, file_slug = m.captures
    if file_date != date_string(data['date'])
      errors << "#{name}: filename date #{file_date} != front matter date #{date_string(data['date'])}"
    end
    expected = title_slug(data['title'])
    errors << "#{name}: filename slug #{file_slug.inspect} != slug of title #{expected.inspect}" if file_slug != expected
  else
    errors << "#{name}: filename must look like YYYY-MM-DD-title-slug.md"
  end

  [[data['author'], authors, 'author', 'yazarlar'], [data['column'], columns, 'column', 'koseler']].each do |value, stubs, key, dir|
    errors << "#{name}: #{key} #{value.inspect} has no matching #{dir}/*.md stub (archive_value)" unless stubs.key?(value)
  end
end

def check_stub(stub, type, dir, errors)
  name = "#{dir}/#{File.basename(stub.file)}"
  data = stub.front_matter
  value = data['archive_value']

  errors << "#{name}: archive_type is #{data['archive_type'].inspect}, expected #{type.inspect}" if data['archive_type'] != type
  errors << "#{name}: title #{data['title'].inspect} != archive_value #{value.inspect}" if data['title'] != value

  expected = "/#{dir}/#{slugify(value)}/"
  return if data['permalink'] == expected

  errors << "#{name}: permalink #{data['permalink'].inspect} != #{expected.inspect}; templates link to the latter"
end

def stubs_for(dir, type, errors)
  pages(dir).each_with_object({}) do |stub, map|
    next if stub.front_matter.nil? || stub.front_matter['archive_value'].nil?

    check_stub(stub, type, dir, errors)
    map[stub.front_matter['archive_value']] = stub
  end
end

errors = []
warnings = []

authors = stubs_for('yazarlar', 'author', errors)
columns = stubs_for('koseler', 'column', errors)
posts = pages('_posts')

posts.each { |post| check_post(post, authors, columns, errors) }

permalinks = Set.new
(pages('.') + pages('yazarlar') + pages('koseler')).each do |page|
  link = page.front_matter && page.front_matter['permalink']
  permalinks << link if link
end

posts.each do |post|
  data = post.front_matter or next
  permalinks << "/posts/#{title_slug(data['title'])}/"
end

posts.each do |post|
  Array(post.front_matter && post.front_matter['redirect_from']).each do |from|
    from = "#{from}/" unless from.end_with?('/')
    if permalinks.include?(from)
      errors << "_posts/#{File.basename(post.file)}: redirect_from #{from} shadows an existing page"
    end
  end
end

used = {
  'author' => posts.filter_map { |p| p.front_matter && p.front_matter['author'] }.to_set,
  'column' => posts.filter_map { |p| p.front_matter && p.front_matter['column'] }.to_set
}
{ 'author' => [authors, 'yazarlar'], 'column' => [columns, 'koseler'] }.each do |key, (stubs, dir)|
  stubs.each do |value, stub|
    next if used[key].include?(value)

    warnings << "#{dir}/#{File.basename(stub.file)}: archive_value #{value.inspect} has no post referencing it"
  end
end

today = Date.today
posts.each do |post|
  date = post.front_matter && post.front_matter['date']
  date = Date.parse(date.to_s) if date && !date.respond_to?(:to_date)
  next unless date && date.to_date > today

  warnings << "_posts/#{File.basename(post.file)}: dated #{date_string(date)}, in the future; Jekyll will not publish it yet"
end

warnings.each { |w| warn "warning: #{w}" }

if errors.empty?
  puts "content OK (#{posts.size} posts, #{authors.size} authors, #{columns.size} columns)"
else
  errors.each { |e| warn "error: #{e}" }
  exit 1
end
