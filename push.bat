echo node_modules/ >> .gitignore
echo uploads/ >> .gitignore
git reset --soft HEAD~1
git rm -r --cached node_modules/ uploads/
git add .
git commit -m "Implement client-side RBAC and dynamic CSS-based navbar"
git push -u origin main
