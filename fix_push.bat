echo .env >> .gitignore
echo node_modules/ >> .gitignore
echo uploads/ >> .gitignore
git checkout --orphan temp_branch
git rm -r --cached .
git add .
git commit -m "Initial commit with RBAC and Navbar fixes"
git branch -D main
git branch -m main
git push -u origin main --force
