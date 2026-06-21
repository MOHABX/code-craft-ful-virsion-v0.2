const fs = require('fs');
const path = require('path');

const cssPath = path.join('c:\\Users\\mohab\\Desktop\\Craft-code-main v1.3\\style', 'style.css');

const cssToAppend = `
/* RBAC Utility Classes */
.hidden { display: none !important; }

body.role-guest .student-only, 
body.role-guest .doctor-only, 
body.role-guest .admin-only { 
    display: none !important; 
}

body.role-student .guest-only, 
body.role-student .doctor-only, 
body.role-student .admin-only { 
    display: none !important; 
}

body.role-doctor .guest-only, 
body.role-doctor .student-only, 
body.role-doctor .admin-only { 
    display: none !important; 
}

body.role-admin .guest-only, 
body.role-admin .student-only, 
body.role-admin .doctor-only { 
    display: none !important; 
}
`;

fs.appendFileSync(cssPath, cssToAppend);
console.log('Appended RBAC classes to style.css');
