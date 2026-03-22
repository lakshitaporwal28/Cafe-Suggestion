const fs = require('fs');
let content = fs.readFileSync('insertCafes.js', 'utf8');

// The goal is to remove all query parameters from zomato image urls.
content = content.replace(/(https:\/\/b\.zmtcdn\.com\/[^\?"']+)\?[^"']+/g, "\$1");

// Replace gstatic thumbnails with Unsplash high-res links
content = content.replace(/https:\/\/encrypted-tbn0\.gstatic\.com\/images\?q=tbn:ANd9GcSevkNHsxIXCbBTbGyEgH9d-TTAGJv7zzVqmQ&s/g, "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1080&q=80");
content = content.replace(/https:\/\/encrypted-tbn0\.gstatic\.com\/images\?q=tbn:ANd9GcS3KBoc-wa1ilCfLqgbkRjYgnihuGC8bYPTCg&s/g, "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1080&q=80");
content = content.replace(/https:\/\/encrypted-tbn0\.gstatic\.com\/images\?q=tbn:ANd9GcRs7nRpykHmGD-cEf1biSdIhV_uN6IHenM8lw&s/g, "https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?w=1080&q=80");

fs.writeFileSync('insertCafes.js', content, 'utf8');
console.log('Fixed insertCafes.js URLs');
