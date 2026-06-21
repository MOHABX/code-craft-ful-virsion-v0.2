const fs = require('fs');
const path = require('path');

const htmlDir = path.join(__dirname, 'html');
const styleDir = path.join(__dirname, 'style');
const files = fs.readdirSync(htmlDir).filter(f => f.endsWith('.html'));

let broken = [];

files.forEach(file => {
    const content = fs.readFileSync(path.join(htmlDir, file), 'utf8');
    const links = content.match(/<link[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/gi) || [];
    
    links.forEach(link => {
        const hrefMatch = link.match(/href=["']([^"']+)["']/i);
        if (hrefMatch) {
            let href = hrefMatch[1];
            if (href.startsWith('http') || href.startsWith('https')) return;
            href = href.split('?')[0]; // remove query params
            
            // resolve relative to htmlDir
            const cssPath = path.resolve(htmlDir, href);
            
            if (!fs.existsSync(cssPath)) {
                broken.push({ html: file, css: href });
            }
        }
    });
});

console.log(JSON.stringify(broken, null, 2));
