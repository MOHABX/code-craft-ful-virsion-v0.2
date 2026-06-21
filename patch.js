const fs = require('fs');
let html = fs.readFileSync('html/dr-dashboard.html', 'utf-8');

html = html.replace(
  '<label class="block text-sm font-bold text-gray-700 mb-1">Course Cover Image (Optional)</label>',
  '<label class="block text-sm font-bold text-gray-700 mb-1">Course Cover Image <span class="text-red-500">(Image only, NO VIDEOS HERE)</span></label>\n                            <p class="text-xs text-gray-500 mb-2">Note: To upload videos, please create the course first, then use the Bulk Upload section below.</p>'
);

html = html.replace(
  'courseSelect.appendChild(option);\n                            });\n                        }',
  'courseSelect.appendChild(option);\n                            });\n                            if (window.lastCreatedCourseId) {\n                                courseSelect.value = window.lastCreatedCourseId;\n                                window.lastCreatedCourseId = null;\n                                renderFileList();\n                            }\n                        }'
);

html = html.replace(
  `alert('✅ Course created successfully!');
                            document.getElementById('createCourseModal').classList.add('hidden');`,
  `alert('✅ Course created successfully!');
                            window.lastCreatedCourseId = data.data.id;
                            document.getElementById('createCourseModal').classList.add('hidden');`
);

fs.writeFileSync('html/dr-dashboard.html', html);
console.log('Patched');
