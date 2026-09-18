#!/usr/bin/env ruby
# frozen_string_literal: true

# Every post's `author`/`column` front matter has to exactly string-match
# an `archive_value` in a hand-written stub under yazarlar/*.md or
# koseler/*.md (see _layouts/archive.html) for that author's/column's
# archive page and the post's own "diğer yazılar" links to work. Nothing
# in Jekyll itself checks that the two stay in sync, so a typo (or even a
# stray straight vs. curly apostrophe) silently produces a dead link with
# no build error. This script is that check, run in CI on every push/PR.

require 'yaml'
require 'set'
require 'date'

ROOT = File.expand_path('..', __dir__)

def front_matter(path)
  text = File.read(path, encoding: 'UTF-8')
  return nil unless text.start_with?('---')

  _, fm, = text.split(/^---\s*$/, 3)
  YAML.safe_load(fm, permitted_classes: [Date, Time])
end

def stub_values(dir)
  Dir.glob(File.join(ROOT, dir, '*.md')).each_with_object({}) do |path, map|
    fm = front_matter(path)
    next unless fm && fm['archive_value']

    map[fm['archive_value']] = File.basename(path)
  end
end

posts = Dir.glob(File.join(ROOT, '_posts', '*.md')).map do |path|
  fm = front_matter(path)
  { path: File.basename(path), author: fm && fm['author'], column: fm && fm['column'] }
end

authors = stub_values('yazarlar')
columns = stub_values('koseler')

errors = []

posts.each do |post|
  if post[:author].nil? || post[:author].empty?
    errors << "#{post[:path]}: missing 'author' front matter"
  elsif !authors.key?(post[:author])
    errors << "#{post[:path]}: author #{post[:author].inspect} has no matching yazarlar/*.md stub (archive_value)"
  end

  if post[:column].nil? || post[:column].empty?
    errors << "#{post[:path]}: missing 'column' front matter"
  elsif !columns.key?(post[:column])
    errors << "#{post[:path]}: column #{post[:column].inspect} has no matching koseler/*.md stub (archive_value)"
  end
end

used_authors = posts.map { |p| p[:author] }.compact.to_set
used_columns = posts.map { |p| p[:column] }.compact.to_set

warnings = []
authors.each do |value, file|
  warnings << "yazarlar/#{file}: archive_value #{value.inspect} has no post referencing it" unless used_authors.include?(value)
end
columns.each do |value, file|
  warnings << "koseler/#{file}: archive_value #{value.inspect} has no post referencing it" unless used_columns.include?(value)
end

warnings.each { |w| warn "warning: #{w}" }

if errors.empty?
  puts "content links OK (#{posts.size} posts, #{authors.size} authors, #{columns.size} columns)"
  exit 0
else
  errors.each { |e| warn "error: #{e}" }
  exit 1
end
